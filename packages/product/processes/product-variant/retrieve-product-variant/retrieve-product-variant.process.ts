import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type RetrieveProductVariantProcessInput, RetrieveProductVariantSchema } from "./retrieve-product-variant.schema";
import type { Database, ProductVariant } from "../../../db/type";

export type RetrieveProductVariantResult = ProductVariant & {
  attributes: Array<{ id: string; title: string; type: string; value: string }>;
  prices?: Array<{ amount: string; currency_code: string }>;
};

export const RETRIEVE_PRODUCT_VARIANT_PROCESS = Symbol("RetrieveProductVariant");

@Process(RETRIEVE_PRODUCT_VARIANT_PROCESS)
export class RetrieveProductVariantProcess
  implements ProcessContract<RetrieveProductVariantResult | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductVariantSchema,
  }) context: ProcessContextType<typeof RetrieveProductVariantSchema>) {
    const { input } = context;

    const variant = await this.db
      .selectFrom("product_variants")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!variant) {
      throw new ValidationError("Product variant not found", [{
        type: "not_found",
        message: "Product variant not found",
        path: "id",
      }]);
    }

    const productId = variant.product_id;
    const attributes: Array<{ id: string; title: string; type: string; value: string }> = [];

    if (productId) {
      const productAttrRows = await this.db
        .selectFrom("product_attribute_values")
        .innerJoin(
          "product_attributes",
          "product_attributes.id",
          "product_attribute_values.attribute_id"
        )
        .innerJoin(
          "product_attribute_group_attributes",
          (join) =>
            join
              .onRef("product_attribute_group_attributes.attribute_group_id", "=", "product_attribute_values.attribute_group_id")
              .onRef("product_attribute_group_attributes.attribute_id", "=", "product_attribute_values.attribute_id")
        )
        .innerJoin("products", "products.id", "product_attribute_values.product_id")
        .where("product_attribute_values.product_id", "=", productId)
        .where("product_attribute_values.deleted_at", "is", null)
        .where("product_attributes.deleted_at", "is", null)
        .where(
          sql`(
            EXISTS (
              SELECT 1 FROM product_attribute_group_relations pagr
              WHERE pagr.product_id = product_attribute_values.product_id
                AND pagr.attribute_group_id = product_attribute_values.attribute_group_id
            )
            OR products.attribute_group_id = product_attribute_values.attribute_group_id
          )`
        )
        .select([
          "product_attributes.id",
          "product_attributes.title",
          "product_attributes.type",
          "product_attribute_values.value",
        ])
        .execute();

      for (const row of productAttrRows) {
        attributes.push({
          id: row.id,
          title: row.title,
          type: row.type,
          value: row.value ?? "",
        });
      }
    }

    // Load prices for this variant
    const prices: Array<{ amount: string; currency_code: string }> = [];
    try {
      const pricingDb = this.db as any;
      const priceSet = await pricingDb
        .selectFrom("price_sets")
        .where(sql`metadata->>'variant_id'`, "=", input.id)
        .where("deleted_at", "is", null)
        .selectAll()
        .executeTakeFirst();

      if (priceSet) {
        const priceRows = await pricingDb
          .selectFrom("prices")
          .where("price_set_id", "=", priceSet.id)
          .where("deleted_at", "is", null)
          .select(["amount", "currency_code"])
          .execute();

        prices.push(...priceRows.map((p) => ({ amount: p.amount, currency_code: p.currency_code })));
      }
    } catch {
      // If price loading fails, continue without prices
    }

    return { ...variant, attributes, prices };
  }
}
