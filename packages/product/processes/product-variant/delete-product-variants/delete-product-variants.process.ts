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
import { type DeleteProductVariantsProcessInput, DeleteProductVariantsSchema } from "./delete-product-variants.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_VARIANTS_PROCESS = Symbol("DeleteProductVariants");

@Process(DELETE_PRODUCT_VARIANTS_PROCESS)
export class DeleteProductVariantsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductVariantsSchema,
  }) context: ProcessContextType<typeof DeleteProductVariantsSchema>): Promise<void> {
    const { input } = context;

    await this.validateVariants(input);
    await this.deleteVariants(input);
  }

  async validateVariants(input: DeleteProductVariantsProcessInput) {
    const variants = await this.db
      .selectFrom("product_variants")
      .where("id", "in", input.variant_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (variants.length !== input.variant_ids.length) {
      const foundIds = variants.map((v) => v.id);
      const missingIds = input.variant_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Product variants not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product variants not found: ${missingIds.join(", ")}`,
          path: "variant_ids",
        }]
      );
    }

    return variants;
  }

  async deleteVariants(input: DeleteProductVariantsProcessInput) {
    this.logger.info("Deleting product variants", {
      variant_ids: input.variant_ids,
    });

    // Soft delete the variants
    await this.db
      .updateTable("product_variants")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.variant_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
