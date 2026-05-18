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
import {
  type UpdateProductVariantProcessInput,
  UpdateProductVariantSchema,
  type UpdateProductVariantsProcessOutput,
} from "./update-product-variants.schema";
import type { Database, Product } from "../../../db/type";

/**
 * Handles the update product variants process.
 * Input: validated process context input for this operation.
 * Output: undefined; the variant row is updated in place.
 */
export const UPDATE_PRODUCT_VARIANTS_PROCESS = Symbol("UpdateProductVariants");

@Process(UPDATE_PRODUCT_VARIANTS_PROCESS)
export class UpdateProductVariantsProcess
  implements
    ProcessContract<
      typeof UpdateProductVariantSchema,
      UpdateProductVariantsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  /**
   * Executes the process business logic.
   * Updates only product_variants fields; does not touch prices, media, or
   * option-value relations.
   */
  async runOperations(
    @ProcessContext({
      schema: UpdateProductVariantSchema,
    })
    context: ProcessContextType<typeof UpdateProductVariantSchema>,
  ) {
    const { input } = context;

    await this.validateVariant(input);
    const product = await this.validateProduct(input);

    await this.updateProductVariant(this.db, input, product);

    return undefined;
  }

  async validateVariant(input: UpdateProductVariantProcessInput) {
    const variant = await this.db
      .selectFrom("product_variants")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!variant) {
      throw new ValidationError("Product variant not found", [
        {
          type: "not_found",
          message: "Product variant not found",
          path: "id",
        },
      ]);
    }

    return variant;
  }

  async validateProduct(
    input: UpdateProductVariantProcessInput,
  ): Promise<Product | null> {
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
      throw new ValidationError("Product not found", [
        {
          type: "not_found",
          message: "Product not found",
          path: "product_id",
        },
      ]);
    }

    return product;
  }

  async updateProductVariant(
    trx: Kysely<Database>,
    input: UpdateProductVariantProcessInput,
    product: Product | null,
  ) {
    this.logger.info("Updating product variant", { input });

    const updateData: {
      title?: string;
      product_id?: string;
      sku?: string | null;
      barcode?: string | null;
      ean?: string | null;
      upc?: string | null;
      allow_backorder?: boolean;
      manage_inventory?: boolean;
      variant_rank?: number;
      thumbnail?: string;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.product_id !== undefined && product) {
      updateData.product_id = product.id;
    }

    if (input.sku !== undefined) {
      updateData.sku = input.sku;
    }

    if (input.barcode !== undefined) {
      updateData.barcode = input.barcode;
    }

    if (input.ean !== undefined) {
      updateData.ean = input.ean;
    }

    if (input.upc !== undefined) {
      updateData.upc = input.upc;
    }

    if (input.allow_backorder !== undefined) {
      updateData.allow_backorder = input.allow_backorder;
    }

    if (input.manage_inventory !== undefined) {
      updateData.manage_inventory = input.manage_inventory;
    }

    if (input.variant_rank !== undefined) {
      updateData.variant_rank = input.variant_rank;
    }

    if (input.thumbnail !== undefined) {
      updateData.thumbnail = input.thumbnail;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    if (Object.keys(updateData).length === 0) {
      return;
    }

    await trx
      .updateTable("product_variants")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .execute();
  }
}
