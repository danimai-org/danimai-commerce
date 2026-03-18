import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  SortOrder,
  paginationResponse,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../db/type";
import {
  PaginatedPriceListsSchema,
  type PaginatedPriceListsProcessOutput,
} from "./paginated-price-lists.schema";

export const PAGINATED_PRICE_LISTS_PROCESS = Symbol("PaginatedPriceLists");

@Process(PAGINATED_PRICE_LISTS_PROCESS)
export class PaginatedPriceListsProcess
  implements
    ProcessContract<
      typeof PaginatedPriceListsSchema,
      PaginatedPriceListsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedPriceListsSchema })
    context: ProcessContextType<typeof PaginatedPriceListsSchema>,
  ): Promise<PaginatedPriceListsProcessOutput> {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "price_lists.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    this.logger.debug("Listing paginated price lists", {
      page,
      limit,
      sorting_field,
      sorting_direction,
    });

    let query = this.db
      .selectFrom("price_lists")
      .where("price_lists.deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("price_lists.id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const allowedSortFields = [
      "price_lists.id",
      "price_lists.name",
      "price_lists.type",
      "price_lists.status",
      "price_lists.starts_at",
      "price_lists.ends_at",
      "price_lists.created_at",
      "price_lists.updated_at",
    ];

    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "price_lists.created_at";
    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    query = query.orderBy(sql.ref(safeSortField), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();

    return paginationResponse(data, total, input);
  }
}
