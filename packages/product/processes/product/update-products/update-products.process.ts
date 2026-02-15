import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateProductsProcessInput, UpdateProductsSchema } from "./update-products.schema";
import type { Database, Product } from "../../../db/type";
import { type UpdateProductProcessInput } from "../update-product/update-product.schema";

export const UPDATE_PRODUCTS_PROCESS = Symbol("UpdateProducts");

@Process(UPDATE_PRODUCTS_PROCESS)
export class UpdateProductsProcess
  implements ProcessContract<Product[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductsSchema,
  }) context: ProcessContextType<typeof UpdateProductsSchema>) {
    const { input } = context;

    if (input.products.length === 0) {
      return [];
    }

    // Bulk validate all products
    const productIds = input.products.map((p) => p.id);
    const productsMap = await this.bulkValidateProducts(productIds);

    // Bulk validate all categories
    const categoryIds = [...new Set(input.products.map((p) => p.category_id).filter((id): id is string => id !== undefined && id !== null))];
    const categoriesMap = await this.bulkValidateCategories(categoryIds);

    // Bulk validate handles
    const handlesMap = await this.bulkValidateHandles(input.products);

    // Update all products
    const updatedProducts: Product[] = [];
    for (const productInput of input.products) {
      const product = productsMap.get(productInput.id);
      if (!product) {
        continue;
      }

      const category = productInput.category_id ? categoriesMap.get(productInput.category_id) ?? null : null;
      const handle = handlesMap.get(productInput.id);
      const updatedProduct = await this.updateProduct(productInput, category, handle);

      if (updatedProduct) {
        updatedProducts.push(updatedProduct);
      }
    }

    return updatedProducts;
  }

  async validateProduct(input: UpdateProductProcessInput) {
    const product = await this.db
      .selectFrom("products")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!product) {
      throw new Error(`Product not found: ${input.id}`);
    }

    return product;
  }

  async bulkValidateProducts(productIds: string[]): Promise<Map<string, Product>> {
    if (productIds.length === 0) {
      return new Map();
    }

    const products = await this.db
      .selectFrom("products")
      .where("id", "in", productIds)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const productsMap = new Map<string, Product>();
    for (const product of products) {
      productsMap.set(product.id, product);
    }

    // Check for missing products
    const missingIds = productIds.filter((id) => !productsMap.has(id));
    if (missingIds.length > 0) {
      throw new Error(`Products not found: ${missingIds.join(", ")}`);
    }

    return productsMap;
  }

  async validateCategory(input: UpdateProductProcessInput) {
    if (!input.category_id) {
      return null;
    }

    const category = await this.db
      .selectFrom("product_categories")
      .where("id", "=", input.category_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    return category;
  }

  async bulkValidateCategories(categoryIds: string[]): Promise<Map<string, { id: string }>> {
    if (categoryIds.length === 0) {
      return new Map();
    }

    const categories = await this.db
      .selectFrom("product_categories")
      .where("id", "in", categoryIds)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const categoriesMap = new Map<string, { id: string }>();
    for (const category of categories) {
      categoriesMap.set(category.id, category);
    }

    return categoriesMap;
  }

  async validateHandle(input: UpdateProductProcessInput): Promise<string | undefined> {
    if (!input.handle) {
      return undefined;
    }

    const existing = await this.db
      .selectFrom("products")
      .where("handle", "=", input.handle)
      .where("id", "!=", input.id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existing) {
      // Generate unique handle
      const baseHandle = input.handle;
      let handle = `${baseHandle}-${Date.now()}`;
      let counter = 1;

      while (true) {
        const existing = await this.db
          .selectFrom("products")
          .where("handle", "=", handle)
          .where("id", "!=", input.id)
          .where("deleted_at", "is", null)
          .select("id")
          .executeTakeFirst();

        if (!existing) {
          return handle;
        }

        handle = `${baseHandle}-${Date.now()}-${counter}`;
        counter++;
      }
    }

    return input.handle;
  }

  async bulkValidateHandles(products: UpdateProductProcessInput[]): Promise<Map<string, string | undefined>> {
    const handlesMap = new Map<string, string | undefined>();

    // Collect all handles that need to be checked
    const handlesToCheck = products
      .filter((p) => p.handle !== undefined)
      .map((p) => ({ productId: p.id, handle: p.handle! }));

    if (handlesToCheck.length === 0) {
      // No handles to validate, return empty map
      return handlesMap;
    }

    // Check existing handles in bulk
    const handles = handlesToCheck.map((h) => h.handle);
    const existingHandles = await this.db
      .selectFrom("products")
      .where("handle", "in", handles)
      .where("deleted_at", "is", null)
      .select(["id", "handle"])
      .execute();

    const existingHandlesByHandle = new Map<string, string[]>();
    for (const existing of existingHandles) {
      if (!existingHandlesByHandle.has(existing.handle)) {
        existingHandlesByHandle.set(existing.handle, []);
      }
      existingHandlesByHandle.get(existing.handle)!.push(existing.id);
    }

    // Validate each handle
    for (const handleInfo of handlesToCheck) {
      const conflictingIds = existingHandlesByHandle.get(handleInfo.handle) || [];
      const hasConflict = conflictingIds.some((id) => id !== handleInfo.productId);

      if (hasConflict) {
        // Generate unique handle
        const baseHandle = handleInfo.handle;
        let uniqueHandle = `${baseHandle}-${Date.now()}`;
        let counter = 1;

        while (true) {
          const exists = await this.db
            .selectFrom("products")
            .where("handle", "=", uniqueHandle)
            .where("id", "!=", handleInfo.productId)
            .where("deleted_at", "is", null)
            .select("id")
            .executeTakeFirst();

          if (!exists) {
            break;
          }

          uniqueHandle = `${baseHandle}-${Date.now()}-${counter}`;
          counter++;
        }

        handlesMap.set(handleInfo.productId, uniqueHandle);
      } else {
        handlesMap.set(handleInfo.productId, handleInfo.handle);
      }
    }

    return handlesMap;
  }

  async updateProduct(
    input: UpdateProductProcessInput,
    category: { id: string } | null,
    handle: string | undefined
  ) {
    this.logger.info("Updating product", { input });

    const updateData: {
      title?: string;
      handle?: string;
      subtitle?: string | null;
      description?: string | null;
      is_giftcard?: boolean;
      discountable?: boolean;
      status?: "draft" | "proposed" | "published" | "rejected";
      thumbnail?: string | null;
      external_id?: string | null;
      category_id?: string | null;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (handle !== undefined) {
      updateData.handle = handle;
    }

    if (input.subtitle !== undefined) {
      updateData.subtitle = input.subtitle ?? null;
    }

    if (input.description !== undefined) {
      updateData.description = input.description ?? null;
    }

    if (input.is_giftcard !== undefined) {
      updateData.is_giftcard = input.is_giftcard;
    }

    if (input.discountable !== undefined) {
      updateData.discountable = input.discountable;
    }

    if (input.status !== undefined) {
      updateData.status = input.status;
    }

    if (input.thumbnail !== undefined) {
      updateData.thumbnail = input.thumbnail ?? null;
    }

    if (input.external_id !== undefined) {
      updateData.external_id = input.external_id ?? null;
    }

    if (input.category_id !== undefined) {
      updateData.category_id = category?.id ?? null;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    return this.db
      .updateTable("products")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
