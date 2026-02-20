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
        .where("product_attribute_values.product_id", "=", productId)
        .where("product_attribute_values.deleted_at", "is", null)
        .where("product_attributes.deleted_at", "is", null)
        .select([
          "product_attributes.id",
          "product_attributes.title",
          "product_attributes.type",
          "product_attribute_values.value as product_value",
        ])
        .execute();

      const variantAttrRows = await this.db
        .selectFrom("variant_attribute_values")
        .where("variant_id", "=", input.id)
        .where("deleted_at", "is", null)
        .select(["attribute_id", "value as variant_value"])
        .execute();

      const variantValueByAttrId = new Map<string, string>();
      for (const r of variantAttrRows) {
        if (r.attribute_id != null && r.variant_value != null) {
          variantValueByAttrId.set(r.attribute_id, r.variant_value);
        }
      }

      for (const row of productAttrRows) {
        const value = variantValueByAttrId.get(row.id) ?? row.product_value ?? "";
        attributes.push({
          id: row.id,
          title: row.title,
          type: row.type,
          value: typeof value === "string" ? value : "",
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
