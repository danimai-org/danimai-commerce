import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { DeleteProductVariantsSchema } from "./delete-product-variants.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the delete product variants process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_PRODUCT_VARIANTS_PROCESS = Symbol("DeleteProductVariants");

@Process(DELETE_PRODUCT_VARIANTS_PROCESS)
export class DeleteProductVariantsProcess implements ProcessContract<typeof DeleteProductVariantsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: DeleteProductVariantsSchema,
  }) context: ProcessContextType<typeof DeleteProductVariantsSchema>) {
    const { input } = context;

    const variants = await this.db
      .selectFrom("product_variants")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .select(["id", "product_id"])
      .execute();

    if (variants.length !== input.ids.length) {
      throw new NotFoundError(
        `Product variants not found`
      );
    }

    const variantIds = variants.map((v) => v.id);
    const productIds = [...new Set(variants.map((v) => v.product_id))];

    // Wipe variants in dependency order. price_sets.variant_id has
    // no FK cascade, so prices/price_sets must be cleaned manually before
    // variants are dropped.
    const pricingDb = this.db as any;

    const existingPriceSets = await pricingDb
      .selectFrom("price_sets")
      .where("variant_id", "in", variantIds)
      .select("id")
      .execute();

    const existingPriceSetIds = (existingPriceSets as { id: string }[]).map(
      (ps) => ps.id,
    );

    if (existingPriceSetIds.length > 0) {
      await pricingDb
        .deleteFrom("prices")
        .where("price_set_id", "in", existingPriceSetIds)
        .execute();

      await pricingDb
        .deleteFrom("price_sets")
        .where("id", "in", existingPriceSetIds)
        .execute();
    }

    await this.db
      .deleteFrom("product_variants")
      .where("id", "in", variantIds)
      .execute();

    await this.db
      .deleteFrom("product_option_values")
      .where("product_id", "in", productIds)
      .execute();
  }
}
