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
  DeleteSalesChannelsSchema,
} from "./delete-sales-channels.schema";
import type { Database } from "@danimai/sales-channel/db";

export const DELETE_SALES_CHANNELS_PROCESS = Symbol("DeleteSalesChannels");

@Process(DELETE_SALES_CHANNELS_PROCESS)
export class DeleteSalesChannelsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteSalesChannelsSchema })
    context: ProcessContextType<typeof DeleteSalesChannelsSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateSalesChannels(input);
    await this.deleteSalesChannels(input);
  }

  async validateSalesChannels(input: DeleteSalesChannelsProcessInput) {
    const rows = await this.db
      .selectFrom("sales_channels")
      .where("id", "in", input.sales_channel_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.sales_channel_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.sales_channel_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Sales channels not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Sales channels not found: ${missing.join(", ")}`,
            path: "sales_channel_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteSalesChannels(input: DeleteSalesChannelsProcessInput) {
    this.logger.info("Deleting sales channels", {
      sales_channel_ids: input.sales_channel_ids,
    });
    await this.db
      .updateTable("sales_channels")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.sales_channel_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
