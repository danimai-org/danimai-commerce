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
import { randomUUID } from "crypto";
import { type UpdateProductCategoryProcessOutput, UpdateProductCategorySchema } from "./update-product-category.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the update product category process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_PRODUCT_CATEGORY_PROCESS = Symbol("UpdateProductCategory");

/**
 * Updates a product category and validates parent hierarchy constraints.
 * Input: category id with partial mutable fields and optional attribute sync.
 * Output: updated category row.
 */
@Process(UPDATE_PRODUCT_CATEGORY_PROCESS)
export class UpdateProductCategoryProcess
  implements ProcessContract<typeof UpdateProductCategorySchema, UpdateProductCategoryProcessOutput> {
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

    if (input.attributes && input.attributes.length > 0) {
      const attributes = await this.db
        .selectFrom("product_attributes")
        .where("id", "in", input.attributes.map((a) => a.attribute_id))
        .where("deleted_at", "is", null)
        .selectAll()
        .execute();

      if (attributes.length !== input.attributes.length) {
        const missingIds = input.attributes
          .filter((a) => !attributes.some((a2) => a2.id === a.attribute_id))
          .map((a) => a.attribute_id);

        throw new ValidationError(`Product attributes not found: ${missingIds.join(", ")}`, [{
          type: "not_found",
          message: `Product attributes not found: ${missingIds.join(", ")}`,
          path: "attributes",
        }]);
      }
    }

    const { attributes, id: _categoryId, ...updateFields } = input;

    return this.db.transaction().execute(async (trx) => {
      const updated = await trx.updateTable("product_categories")
        .set({
          ...updateFields,
          updated_at: new Date(),
        })
        .where("id", "=", input.id)
        .returningAll()
        .executeTakeFirst();

      if (attributes !== undefined) {
        await trx.deleteFrom("product_category_attribute_relations")
          .where("category_id", "=", input.id)
          .execute();

        if (attributes.length > 0) {
          await trx
            .insertInto("product_category_attribute_relations")
            .values(attributes.map((a, rank) => ({
              id: randomUUID(),
              category_id: input.id,
              product_attribute_id: a.attribute_id,
              required: a.required ?? false,
              rank,
            })))
            .execute();
        }
      }

      return updated;
    });
  }

  private async getCategoryDescendants(categoryId: string): Promise<string[]> {
    const descendants: string[] = [];
    const queue = [categoryId];
    const categories = await this.db
      .selectFrom("product_categories")
      .where("deleted_at", "is", null)
      .select(["id", "parent_id"])
      .execute();
    const childrenByParent = new Map<string, string[]>();
    for (const category of categories) {
      if (!category.parent_id) continue;
      const childIds = childrenByParent.get(category.parent_id) ?? [];
      childIds.push(category.id);
      childrenByParent.set(category.parent_id, childIds);
    }

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const children = childrenByParent.get(currentId) ?? [];
      for (const childId of children) {
        descendants.push(childId);
        queue.push(childId);
      }
    }

    return descendants;
  }
}
