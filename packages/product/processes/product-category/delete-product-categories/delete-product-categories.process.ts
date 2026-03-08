import {
  InjectDB,
  InjectLogger,
  NotFoundError,
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
export class DeleteProductCategoriesProcess implements ProcessContract<typeof DeleteProductCategoriesSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

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
    await this.db.transaction().execute(async (trx) => {
       await trx
        .updateTable("products")
        .where("products.id", "in", input.category_ids)
        .set({ category_id: null })
        .execute();
      
      // Delete child categories recursively
       await trx.withRecursive('CategoryHierarchy', (qb) => qb
      .selectFrom('product_categories')
      .select('id')
      .where('id', 'in', input.category_ids)
      .unionAll((qb) => qb
        .selectFrom('product_categories as c')
        .innerJoin('CategoryHierarchy as ch', 'c.parent_id', 'ch.id')
        .select('c.id')
      )
    )
    .deleteFrom('product_categories')
    .where('id', 'in', (qb) => qb.selectFrom('CategoryHierarchy').select('id'))
    .execute();

    });
  }

}
