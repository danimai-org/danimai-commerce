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
import { type CreateProductVariantProcessInput, CreateProductVariantSchema } from "./create-product-variants.schema";
import type { Database, ProductVariant, Product } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_VARIANTS_PROCESS = Symbol("CreateProductVariants");

@Process(CREATE_PRODUCT_VARIANTS_PROCESS)
export class CreateProductVariantsProcess
  implements ProcessContract<ProductVariant | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductVariantSchema,
  }) context: ProcessContextType<typeof CreateProductVariantSchema>) {
    const { input } = context;

    const product = await this.validateProduct(input);

    return this.db.transaction().execute(async (trx) => {
      const variant = await this.createProductVariant(trx, input, product);
      if (input.prices && input.prices.length > 0) {
        await this.createVariantPrices(trx, variant.id, input.prices);
      }
      return variant;
    });
  }

  async validateProduct(input: CreateProductVariantProcessInput): Promise<Product | null> {
    if (!input.product_id) {
      return null;
    }

    const product = await this.db
      .selectFrom("products")
      .where("id", "=", input.product_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!product) {
      throw new ValidationError("Product not found", [{
        type: "not_found",
        message: "Product not found",
        path: "product_id",
      }]);
    }

    return product;
  }

  async createProductVariant(
    trx: Kysely<Database>,
    input: CreateProductVariantProcessInput,
    product: Product | null
  ) {
    this.logger.info("Creating product variant", { input });

    const variant = await trx
      .insertInto("product_variants")
      .values({
        id: sql`gen_random_uuid()`,
        title: input.title,
        product_id: product?.id ?? null,
        sku: input.sku ?? null,
        barcode: input.barcode ?? null,
        ean: input.ean ?? null,
        upc: input.upc ?? null,
        allow_backorder: input.allow_backorder ?? false,
        manage_inventory: input.manage_inventory ?? false,
        variant_rank: input.variant_rank ?? null,
        thumbnail: input.thumbnail ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!variant) {
      throw new Error("Failed to create product variant");
    }

    return variant;
  }

  async createVariantPrices(
    trx: Kysely<Database>,
    variantId: string,
    prices: Array<{
      amount: number;
      currency_code: string;
      min_quantity?: number;
      max_quantity?: number;
      price_list_id?: string;
    }>
  ) {
    if (prices.length === 0) {
      return;
    }

    // Create price_set for the variant
    // Using type assertion to access pricing tables
    const pricingDb = trx as any;
    const priceSet = await pricingDb
      .insertInto("price_sets")
      .values({
        id: randomUUID(),
        metadata: { variant_id: variantId },
      })
      .returningAll()
      .executeTakeFirst();

    if (!priceSet) {
      throw new Error("Failed to create price_set");
    }

    // Bulk insert prices
    await pricingDb
      .insertInto("prices")
      .values(
        prices.map((priceInput) => ({
          id: randomUUID(),
          price_set_id: priceSet.id,
          amount: priceInput.amount.toString(),
          currency_code: priceInput.currency_code,
          min_quantity: priceInput.min_quantity ?? null,
          max_quantity: priceInput.max_quantity ?? null,
          price_list_id: priceInput.price_list_id ?? null,
          metadata: null,
        }))
      )
      .execute();
  }
}
