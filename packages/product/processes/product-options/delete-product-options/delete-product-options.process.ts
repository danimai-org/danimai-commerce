import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type DeleteProductOptionsProcessInput, DeleteProductOptionsSchema } from "./delete-product-options.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_OPTIONS_PROCESS = Symbol("DeleteProductOptions");

@Process(DELETE_PRODUCT_OPTIONS_PROCESS)
export class DeleteProductOptionsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductOptionsSchema,
  }) context: ProcessContextType<typeof DeleteProductOptionsSchema>): Promise<void> {
    const { input } = context;

    await this.validateOptions(input);
    await this.checkOptionUsage(input);
    await this.deleteOptions(input);
  }

  async validateOptions(input: DeleteProductOptionsProcessInput) {
    const options = await this.db
      .selectFrom("product_options")
      .where("id", "in", input.option_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (options.length !== input.option_ids.length) {
      const foundIds = options.map((o) => o.id);
      const missingIds = input.option_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Product options not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product options not found: ${missingIds.join(", ")}`,
          path: "option_ids",
        }]
      );
    }

    return options;
  }

  async checkOptionUsage(input: DeleteProductOptionsProcessInput) {
    // Check if any option has option values
    const optionsWithValues = await this.db
      .selectFrom("product_option_values")
      .where("option_id", "in", input.option_ids)
      .where("deleted_at", "is", null)
      .select("option_id")
      .execute();

    if (optionsWithValues.length > 0) {
      const usedOptionIds = [
        ...new Set(optionsWithValues.map((ov) => ov.option_id)),
      ].filter((id): id is string => id !== null);
      throw new ValidationError(
        `Product options are in use by option values: ${usedOptionIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product options are in use by option values: ${usedOptionIds.join(", ")}`,
          path: "option_ids",
        }]
      );
    }

    // Check if any option is used in variant option relations
    const optionsInVariants = await this.db
      .selectFrom("product_variant_option_relations")
      .innerJoin("product_option_values", "product_option_values.id", "product_variant_option_relations.option_value_id")
      .where("product_option_values.option_id", "in", input.option_ids)
      .select("product_option_values.option_id")
      .execute();

    if (optionsInVariants.length > 0) {
      const usedOptionIds = [
        ...new Set(optionsInVariants.map((r) => r.option_id)),
      ].filter((id): id is string => id !== null);
      throw new ValidationError(
        `Product options are in use by product variants: ${usedOptionIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product options are in use by product variants: ${usedOptionIds.join(", ")}`,
          path: "option_ids",
        }]
      );
    }
  }

  async deleteOptions(input: DeleteProductOptionsProcessInput) {
    this.logger.info("Deleting product options", {
      option_ids: input.option_ids,
    });

    await this.db
      .updateTable("product_options")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.option_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
