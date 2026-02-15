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
  type UpdateSalesChannelProcessInput,
  UpdateSalesChannelSchema,
} from "./update-sales-channels.schema";
import type { Database, SalesChannel } from "@danimai/sales-channel/db";

export const UPDATE_SALES_CHANNELS_PROCESS = Symbol("UpdateSalesChannels");

@Process(UPDATE_SALES_CHANNELS_PROCESS)
export class UpdateSalesChannelsProcess
  implements ProcessContract<SalesChannel | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateSalesChannelSchema })
    context: ProcessContextType<typeof UpdateSalesChannelSchema>
  ) {
    const { input } = context;
    await this.validateSalesChannel(input);
    return this.updateSalesChannel(input);
  }

  async validateSalesChannel(input: UpdateSalesChannelProcessInput) {
    const row = await this.db
      .selectFrom("sales_channels")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Sales channel not found", [
        { type: "not_found", message: "Sales channel not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateSalesChannel(input: UpdateSalesChannelProcessInput) {
    this.logger.info("Updating sales channel", { input });
    const updateData: {
      name?: string;
      description?: string | null;
      is_default?: boolean;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.is_default !== undefined) updateData.is_default = input.is_default;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("sales_channels")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
