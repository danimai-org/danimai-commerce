import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateProductCategoryProcessInput, UpdateProductCategorySchema } from "./update-product-categories.schema";
import type { Database, ProductCategory, ProductCategoryStatus, ProductCategoryVisibility } from "../../../db/type";

export const UPDATE_PRODUCT_CATEGORIES_PROCESS = Symbol("UpdateProductCategories");

@Process(UPDATE_PRODUCT_CATEGORIES_PROCESS)
export class UpdateProductCategoriesProcess
  implements ProcessContract<ProductCategory | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductCategorySchema,
  }) context: ProcessContextType<typeof UpdateProductCategorySchema>) {
    const { input } = context;

    const category = await this.validateCategory(input);
    const parentCategory = await this.validateParentCategory(input);

    return this.updateProductCategory(input, parentCategory);
  }

  async validateCategory(input: UpdateProductCategoryProcessInput) {
    const category = await this.db
      .selectFrom("product_categories")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!category) {
      throw new ValidationError("Category not found", [{
        type: "not_found",
        message: "Category not found",
        path: "id",
      }]);
    }

    return category;
  }

  async validateParentCategory(input: UpdateProductCategoryProcessInput) {
    if (!input.parent_id) {
      return null;
    }

    // Prevent self-reference
    if (input.parent_id === input.id) {
      throw new ValidationError("Category cannot be its own parent", [{
        type: "not_found",
        message: "Category cannot be its own parent",
        path: "parent_id",
      }]);
    }

    const parentCategory = await this.db
      .selectFrom("product_categories")
      .where("id", "=", input.parent_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!parentCategory) {
      throw new ValidationError("Parent category not found", [{
        type: "not_found",
        message: "Parent category not found",
        path: "parent_id",
      }]);
    }

    // Prevent circular reference - check if the parent is a descendant of this category
    const descendants = await this.getCategoryDescendants(input.id);
    if (descendants.includes(input.parent_id)) {
      throw new ValidationError(
        "Cannot set parent: would create circular reference",
        [{
          type: "not_found",
          message: "Cannot set parent: would create circular reference",
          path: "parent_id",
        }]
      );
    }

    return parentCategory;
  }

  async getCategoryDescendants(categoryId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [categoryId];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = await this.db
        .selectFrom("product_categories")
        .where("parent_id", "=", currentId)
        .where("deleted_at", "is", null)
        .select("id")
        .execute();

      for (const child of children) {
        descendants.push(child.id);
        queue.push(child.id);
      }
    }

    return descendants;
  }

  async updateProductCategory(
    input: UpdateProductCategoryProcessInput,
    parentCategory: ProductCategory | null
  ) {
    this.logger.info("Updating product category", { input });

    const updateData: {
      value?: string;
      parent_id?: string | null;
      status?: ProductCategoryStatus;
      visibility?: ProductCategoryVisibility;
      metadata?: unknown;
    } = {};

    if (input.value !== undefined) {
      updateData.value = input.value;
    }

    if (input.parent_id !== undefined) {
      updateData.parent_id = parentCategory?.id ?? null;
    }

    if (input.status !== undefined) {
      updateData.status = input.status as ProductCategoryStatus;
    }

    if (input.visibility !== undefined) {
      updateData.visibility = input.visibility as ProductCategoryVisibility;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    return this.db
      .updateTable("product_categories")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
