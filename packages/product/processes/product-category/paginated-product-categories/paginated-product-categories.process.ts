import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { paginationResponse } from "@danimai/core/pagination";
import { Kysely, sql } from "kysely";
import {
  type PaginatedProductCategoriesProcessOutput,
  PaginatedProductCategoriesSchema,
} from "./paginated-product-categories.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_PRODUCT_CATEGORIES_PROCESS = Symbol("PaginatedProductCategories");

@Process(PAGINATED_PRODUCT_CATEGORIES_PROCESS)
export class PaginatedProductCategoriesProcess
  implements ProcessContract<
    typeof PaginatedProductCategoriesSchema,
    PaginatedProductCategoriesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductCategoriesSchema,
  }) context: ProcessContextType<typeof PaginatedProductCategoriesSchema>) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;

    let query = this.db
      .selectFrom("product_categories")
      .where("deleted_at", "is", null);

    if(search && search.trim()) {
      query = query.where("value", "ilike", `%${search.trim()}%`);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(`${sorting_field}`), sorting_direction);

    const categories = await query
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return paginationResponse(categories, total, input);
  }
}
