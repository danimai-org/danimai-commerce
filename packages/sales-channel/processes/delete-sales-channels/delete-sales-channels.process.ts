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
import {
  type DeleteSalesChannelsProcessInput,
  type DeleteSalesChannelsProcessOutput,
  DeleteSalesChannelsSchema,
} from "./delete-sales-channels.schema";
import type { Database } from "@danimai/sales-channel/db";

export const DELETE_SALES_CHANNELS_PROCESS = Symbol("DeleteSalesChannels");

@Process(DELETE_SALES_CHANNELS_PROCESS)
export class DeleteSalesChannelsProcess
  implements ProcessContract<
    typeof DeleteSalesChannelsSchema,
    DeleteSalesChannelsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteSalesChannelsSchema })
    context: ProcessContextType<typeof DeleteSalesChannelsSchema>
  ) {
    const { input } = context;
    const rows = await this.db
      .selectFrom("sales_channels")
      .where("id", "in", input.sales_channel_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.sales_channel_ids.length) {

      throw new ValidationError(
        `Sales channels not found`,
        [
          {
            type: "not_found",
            message: `Sales channels not found`,
            path: "sales_channel_ids",
          },
        ]
      );
    }


    await this.db
      .deleteFrom("sales_channels")
      .where("id", "in", input.sales_channel_ids)
      .execute();
  }


}
