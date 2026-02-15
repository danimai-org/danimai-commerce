import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type ListSalesChannelsByIdsProcessInput,
  ListSalesChannelsByIdsSchema,
} from "./list-sales-channels-by-ids.schema";
import type { Database, SalesChannel } from "@danimai/sales-channel/db";

export const LIST_SALES_CHANNELS_BY_IDS_PROCESS = Symbol(
  "ListSalesChannelsByIds"
);

@Process(LIST_SALES_CHANNELS_BY_IDS_PROCESS)
export class ListSalesChannelsByIdsProcess
  implements ProcessContract<SalesChannel[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: ListSalesChannelsByIdsSchema })
    context: ProcessContextType<typeof ListSalesChannelsByIdsSchema>
  ) {
    const { input } = context;
    if (input.ids.length === 0) return [];
    return this.db
      .selectFrom("sales_channels")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
  }
}
