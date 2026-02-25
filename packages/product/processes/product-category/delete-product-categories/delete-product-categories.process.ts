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
import { type DeleteProductCategoriesProcessInput, DeleteProductCategoriesSchema } from "./delete-product-categories.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_CATEGORIES_PROCESS = Symbol("DeleteProductCategories");

@Process(DELETE_PRODUCT_CATEGORIES_PROCESS)
export class DeleteProductCategoriesProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductCategoriesSchema,
  }) context: ProcessContextType<typeof DeleteProductCategoriesSchema>): Promise<void> {
    const { input } = context;

    await this.validateCategories(input);
    await this.unassignProductsFromCategories(input);
    await this.unassignChildCategories(input);
    await this.checkCategoryUsage(input);
    await this.deleteCategories(input);
  }

  async unassignProductsFromCategories(input: DeleteProductCategoriesProcessInput) {
    await this.db
      .updateTable("products")
      .set({ category_id: null })
      .where("category_id", "in", input.category_ids)
      .where("deleted_at", "is", null)
      .execute();
  }

  async unassignChildCategories(input: DeleteProductCategoriesProcessInput) {
    await this.db
      .updateTable("product_categories")
      .set({ parent_id: null })
      .where("parent_id", "in", input.category_ids)
      .where("deleted_at", "is", null)
      .execute();
  }

  async validateCategories(input: DeleteProductCategoriesProcessInput) {
    const categories = await this.db
      .selectFrom("product_categories")
      .where("id", "in", input.category_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (categories.length !== input.category_ids.length) {
      const foundIds = categories.map((c) => c.id);
      const missingIds = input.category_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Categories not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Categories not found: ${missingIds.join(", ")}`,
          path: "category_ids",
        }]
      );
    }

    return categories;
  }

  async checkCategoryUsage(input: DeleteProductCategoriesProcessInput) {
    const productsWithCategories = await this.db
      .selectFrom("products")
      .where("category_id", "in", input.category_ids)
      .where("deleted_at", "is", null)
      .select("category_id")
      .execute();

    if (productsWithCategories.length > 0) {
      const usedCategoryIds = [
        ...new Set(productsWithCategories.map((p) => p.category_id)),
      ].filter((id): id is string => id !== null);
      throw new ValidationError(
        `Categories are in use by products: ${usedCategoryIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Categories are in use by products: ${usedCategoryIds.join(", ")}`,
          path: "category_ids",
        }]
      );
    }
  }

  async deleteCategories(input: DeleteProductCategoriesProcessInput) {
    this.logger.info("Deleting product categories", {
      category_ids: input.category_ids,
    });

    await this.db
      .updateTable("product_categories")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.category_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
