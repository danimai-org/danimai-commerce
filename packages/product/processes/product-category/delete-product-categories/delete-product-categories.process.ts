import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type DeleteProductCategoriesProcessInput, DeleteProductCategoriesSchema } from "./delete-product-categories.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the delete product categories process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_PRODUCT_CATEGORIES_PROCESS = Symbol("DeleteProductCategories");

@Process(DELETE_PRODUCT_CATEGORIES_PROCESS)
export class DeleteProductCategoriesProcess implements ProcessContract<typeof DeleteProductCategoriesSchema, void> {
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
    schema: DeleteProductCategoriesSchema,
  }) context: ProcessContextType<typeof DeleteProductCategoriesSchema>) {
    const { input } = context;

     const categories = await this.db
      .selectFrom("product_categories")
      .where("product_categories.id", "in", input.category_ids)
      .where("deleted_at", "is", null)
      .select("product_categories.id")
      .execute();

    if (categories.length !== input.category_ids.length) {
      const foundIds = categories.map((c) => c.id);
      const missingIds = input.category_ids.filter((id) => !foundIds.includes(id));

      throw new NotFoundError(`Categories not found: ${missingIds.join(", ")}`);
    }

    await this.deleteCategories(input);
  }


  async deleteCategories(input: DeleteProductCategoriesProcessInput) {
    const rows = await this.db
      .withRecursive("category_hierarchy", (qb) =>
        qb
          .selectFrom("product_categories")
          .select("id")
          .where("id", "in", input.category_ids)
          .unionAll((qb) =>
            qb
              .selectFrom("product_categories as c")
              .innerJoin("category_hierarchy as ch", (join) =>
                join.onRef("c.parent_id", "=", "ch.id")
              )
              .select("c.id")
          )
      )
      .selectFrom("category_hierarchy")
      .select("id")
      .execute();

    const ids = rows.map((r) => r.id);
    if (ids.length === 0) return;

    await this.db
      .updateTable("products")
      .set({ category_id: null })
      .where("category_id", "in", ids)
      .execute();

    await this.db.deleteFrom("product_categories").where("id", "in", ids).execute();
  }

}
