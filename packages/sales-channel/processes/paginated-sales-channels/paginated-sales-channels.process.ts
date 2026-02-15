import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  type PaginationResponseType,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedSalesChannelsProcessInput,
  PaginatedSalesChannelsSchema,
} from "./paginated-sales-channels.schema";
import type { Database, SalesChannel } from "@danimai/sales-channel/db";

export const PAGINATED_SALES_CHANNELS_PROCESS = Symbol("PaginatedSalesChannels");

@Process(PAGINATED_SALES_CHANNELS_PROCESS)
export class PaginatedSalesChannelsProcess
  implements ProcessContract<PaginationResponseType<SalesChannel>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: PaginatedSalesChannelsSchema })
    context: ProcessContextType<typeof PaginatedSalesChannelsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("sales_channels")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "description",
      "is_default",
      "created_at",
      "updated_at",
      "deleted_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`sales_channels.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query.selectAll().limit(limit).offset(offset).execute();
    return paginationResponse<SalesChannel>(data, total, input);
  }
}
