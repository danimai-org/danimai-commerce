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
    await this.deleteVariantOptionRelations(input);
    await this.deleteOptionValues(input);
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

  async deleteVariantOptionRelations(input: DeleteProductOptionsProcessInput) {
    // Delete variant-option relations for the options being deleted
    // This allows deletion of options even when they're used by variants
    const optionValueIds = await this.db
      .selectFrom("product_option_values")
      .where("option_id", "in", input.option_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute()
      .then((rows) => rows.map((r) => r.id));

    if (optionValueIds.length > 0) {
      this.logger.info("Deleting variant-option relations", {
        option_ids: input.option_ids,
        option_value_ids: optionValueIds,
      });

      await this.db
        .deleteFrom("product_variant_option_relations")
        .where("option_value_id", "in", optionValueIds)
        .execute();
    }
  }

  async deleteOptionValues(input: DeleteProductOptionsProcessInput) {
    this.logger.info("Deleting product option values", {
      option_ids: input.option_ids,
    });

    // Soft delete all option values associated with these options
    await this.db
      .updateTable("product_option_values")
      .set({ deleted_at: new Date().toISOString() })
      .where("option_id", "in", input.option_ids)
      .where("deleted_at", "is", null)
      .execute();
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
