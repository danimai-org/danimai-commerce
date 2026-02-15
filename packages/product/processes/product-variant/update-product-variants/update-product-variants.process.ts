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
import { type UpdateProductVariantProcessInput, UpdateProductVariantSchema } from "./update-product-variants.schema";
import type { Database, ProductVariant, Product } from "../../../db/type";

export const UPDATE_PRODUCT_VARIANTS_PROCESS = Symbol("UpdateProductVariants");

@Process(UPDATE_PRODUCT_VARIANTS_PROCESS)
export class UpdateProductVariantsProcess
  implements ProcessContract<ProductVariant | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductVariantSchema,
  }) context: ProcessContextType<typeof UpdateProductVariantSchema>) {
    const { input } = context;

    await this.validateVariant(input);
    const product = await this.validateProduct(input);

    return this.db.transaction().execute(async (trx) => {
      const variant = await this.updateProductVariant(trx, input, product);
      if (input.attribute_values !== undefined) {
        await this.syncVariantAttributeValues(trx, input.id, input.attribute_values);
      }
      return variant;
    });
  }

  async validateVariant(input: UpdateProductVariantProcessInput) {
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

    return variant;
  }

  async validateProduct(input: UpdateProductVariantProcessInput): Promise<Product | null> {
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

  async updateProductVariant(
    trx: Kysely<Database>,
    input: UpdateProductVariantProcessInput,
    product: Product | null
  ) {
    this.logger.info("Updating product variant", { input });

    const updateData: {
      title?: string;
      product_id?: string | null;
      sku?: string | null;
      barcode?: string | null;
      ean?: string | null;
      upc?: string | null;
      allow_backorder?: boolean;
      manage_inventory?: boolean;
      variant_rank?: number | null;
      thumbnail?: string | null;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.product_id !== undefined) {
      updateData.product_id = product?.id ?? null;
    }

    if (input.sku !== undefined) {
      updateData.sku = input.sku ?? null;
    }

    if (input.barcode !== undefined) {
      updateData.barcode = input.barcode ?? null;
    }

    if (input.ean !== undefined) {
      updateData.ean = input.ean ?? null;
    }

    if (input.upc !== undefined) {
      updateData.upc = input.upc ?? null;
    }

    if (input.allow_backorder !== undefined) {
      updateData.allow_backorder = input.allow_backorder;
    }

    if (input.manage_inventory !== undefined) {
      updateData.manage_inventory = input.manage_inventory;
    }

    if (input.variant_rank !== undefined) {
      updateData.variant_rank = input.variant_rank ?? null;
    }

    if (input.thumbnail !== undefined) {
      updateData.thumbnail = input.thumbnail ?? null;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    const updated = await trx
      .updateTable("product_variants")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();

    return updated;
  }

  async syncVariantAttributeValues(
    trx: Kysely<Database>,
    variantId: string,
    attributeValues: Array<{ attribute_id: string; value: string }>
  ) {
    await trx
      .deleteFrom("variant_attribute_values")
      .where("variant_id", "=", variantId)
      .execute();

    const toInsert = attributeValues.filter((a) => a.value.trim() !== "");
    if (toInsert.length === 0) {
      return;
    }

    await trx
      .insertInto("variant_attribute_values")
      .values(
        toInsert.map((a) => ({
          variant_id: variantId,
          attribute_id: a.attribute_id,
          value: a.value.trim(),
        }))
      )
      .execute();
  }
}
