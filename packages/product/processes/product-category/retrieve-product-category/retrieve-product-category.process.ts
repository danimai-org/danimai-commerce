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
import { type RetrieveProductCategoryProcessInput, RetrieveProductCategorySchema } from "./retrieve-product-category.schema";
import type { Database, ProductCategory } from "../../../db/type";

export const RETRIEVE_PRODUCT_CATEGORY_PROCESS = Symbol("RetrieveProductCategory");

@Process(RETRIEVE_PRODUCT_CATEGORY_PROCESS)
export class RetrieveProductCategoryProcess
  implements ProcessContract<ProductCategory | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductCategorySchema,
  }) context: ProcessContextType<typeof RetrieveProductCategorySchema>) {
    const { input } = context;

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
}
