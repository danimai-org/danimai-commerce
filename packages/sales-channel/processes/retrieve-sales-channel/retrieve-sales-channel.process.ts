import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type RetrieveSalesChannelProcessOutput,
  RetrieveSalesChannelSchema,
} from "./retrieve-sales-channel.schema";
import type { Database } from "@danimai/sales-channel/db";

export const RETRIEVE_SALES_CHANNEL_PROCESS = Symbol("RetrieveSalesChannel");

@Process(RETRIEVE_SALES_CHANNEL_PROCESS)
export class RetrieveSalesChannelProcess
  implements ProcessContract<
    typeof RetrieveSalesChannelSchema,
    RetrieveSalesChannelProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveSalesChannelSchema })
    context: ProcessContextType<typeof RetrieveSalesChannelSchema>
  ) {
    const { input } = context;

    return this.db
      .selectFrom("sales_channels")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
  }
}
