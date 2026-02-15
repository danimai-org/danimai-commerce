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
  type CreateSalesChannelProcessInput,
  CreateSalesChannelsSchema,
} from "./create-sales-channels.schema";
import type { Database, SalesChannel } from "@danimai/sales-channel/db";

export const CREATE_SALES_CHANNELS_PROCESS = Symbol("CreateSalesChannels");

@Process(CREATE_SALES_CHANNELS_PROCESS)
export class CreateSalesChannelsProcess
  implements ProcessContract<SalesChannel[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateSalesChannelsSchema })
    context: ProcessContextType<typeof CreateSalesChannelsSchema>
  ) {
    const { input } = context;
    const created: SalesChannel[] = [];
    for (const s of input.sales_channels) {
      const row = await this.createSalesChannel(s);
      if (row) created.push(row);
    }
    return created;
  }

  async createSalesChannel(input: CreateSalesChannelProcessInput) {
    this.logger.info("Creating sales channel", { input });
    return this.db
      .insertInto("sales_channels")
      .values({
        name: input.name,
        description: input.description ?? null,
        is_default: input.is_default ?? false,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
