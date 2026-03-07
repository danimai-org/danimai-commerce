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
  type PaginatedProductVariantsProcessOutput,
  PaginatedProductVariantsSchema,
} from "./paginated-product-variants.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_PRODUCT_VARIANTS_PROCESS = Symbol("PaginatedProductVariants");

@Process(PAGINATED_PRODUCT_VARIANTS_PROCESS)
export class PaginatedProductVariantsProcess
  implements ProcessContract<
    typeof PaginatedProductVariantsSchema,
    PaginatedProductVariantsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductVariantsSchema,
  }) context: ProcessContextType<typeof PaginatedProductVariantsSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC, search } = input;

    let query = this.db
      .selectFrom("product_variants")
      .where("deleted_at", "is", null);

    if(search && search.trim()) {
      query = query.where("title", "ilike", `%${search.trim()}%`);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(`${sorting_field}`), sorting_direction);

    const variants = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .selectAll()
      .execute();

    return paginationResponse(variants, total, input);
  }
}
