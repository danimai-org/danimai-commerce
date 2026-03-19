import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedSalesChannelsProcessOutput,
  PaginatedSalesChannelsSchema,
} from "./paginated-sales-channels.schema";
import type { Database } from "@danimai/sales-channel/db";

export const PAGINATED_SALES_CHANNELS_PROCESS = Symbol("PaginatedSalesChannels");

@Process(PAGINATED_SALES_CHANNELS_PROCESS)
export class PaginatedSalesChannelsProcess
  implements ProcessContract<
    typeof PaginatedSalesChannelsSchema,
    PaginatedSalesChannelsProcessOutput
  > {
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
      sorting_field = "sales_channels.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("sales_channels")
      .where("deleted_at", "is", null);

    if (input.filters?.is_default !== undefined) {
      query = query.where("is_default", "=", input.filters.is_default);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (Number(page) - 1) * Number(limit);
    const data = await query
      .selectAll()
      .limit(Number(limit))
      .offset(Number(offset))

      .execute();
    return paginationResponse(data, total, input);
  }
}
