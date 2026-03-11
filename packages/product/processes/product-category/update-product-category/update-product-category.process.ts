import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateProductCategoryProcessOutput, UpdateProductCategorySchema } from "./update-product-category.schema";
import type { Database } from "../../../db/type";

export const UPDATE_PRODUCT_CATEGORY_PROCESS = Symbol("UpdateProductCategory");

@Process(UPDATE_PRODUCT_CATEGORY_PROCESS)
export class UpdateProductCategoryProcess
  implements ProcessContract<typeof UpdateProductCategorySchema, UpdateProductCategoryProcessOutput> {
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

    const category = await this.db.selectFrom("product_categories")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!category) {
      throw new NotFoundError("Product category not found");
    }

    if (input.value !== undefined) {
      const existingCategory = await this.db
        .selectFrom("product_categories")
        .where("value", "ilike", input.value)
        .where("deleted_at", "is", null)
        .where("id", "!=", input.id)
        .selectAll()
        .executeTakeFirst();

      if (existingCategory) {
        throw new ValidationError("Product category already exists", [{
          type: "already_exists",
          message: "Product category already exists",
          path: "value",
        }]);
      }
    }

    if (input.parent_id !== undefined) {
      if (input.parent_id === input.id) {
        throw new ValidationError("Category cannot be its own parent", [{
          type: "invalid",
          message: "Category cannot be its own parent",
          path: "parent_id",
        }]);
      }

      if (input.parent_id) {
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

        const descendants = await this.getCategoryDescendants(input.id);
        if (descendants.includes(input.parent_id)) {
          throw new ValidationError("Cannot set parent: would create circular reference", [{
            type: "invalid",
            message: "Cannot set parent: would create circular reference",
            path: "parent_id",
          }]);
        }
      }
    }

    return this.db.updateTable("product_categories")
      .set({
        ...input,
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();
  }

  private async getCategoryDescendants(categoryId: string): Promise<string[]> {
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
}
