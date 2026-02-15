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

    return this.createProductVariant(input, product);
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

  async createProductVariant(input: CreateProductVariantProcessInput, product: Product | null) {
    this.logger.info("Creating product variant", { input });

    return this.db
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
  }
}
