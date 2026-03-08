import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { type RetrieveProductCategoryProcessOutput, RetrieveProductCategorySchema } from "./retrieve-product-category.schema";
import type { Database } from "../../../db/type";

export const RETRIEVE_PRODUCT_CATEGORY_PROCESS = Symbol("RetrieveProductCategory");

@Process(RETRIEVE_PRODUCT_CATEGORY_PROCESS)
export class RetrieveProductCategoryProcess
  implements ProcessContract<typeof RetrieveProductCategorySchema, RetrieveProductCategoryProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductCategorySchema,
  }) context: ProcessContextType<typeof RetrieveProductCategorySchema>) {
    const { input } = context;

    const category = await this.db
      .selectFrom("product_categories")
      .where("product_categories.id", "=", input.id)
      .where("product_categories.deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    return category;
  }
}
