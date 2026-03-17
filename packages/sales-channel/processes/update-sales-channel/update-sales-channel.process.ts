import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateSalesChannelProcessInput,
  type UpdateSalesChannelProcessOutput,
  UpdateSalesChannelSchema,
} from "./update-sales-channel.schema";
import type { Database } from "@danimai/sales-channel/db";

export const UPDATE_SALES_CHANNEL_PROCESS = Symbol("UpdateSalesChannel");

@Process(UPDATE_SALES_CHANNEL_PROCESS)
export class UpdateSalesChannelProcess
  implements ProcessContract<
    typeof UpdateSalesChannelSchema,
    UpdateSalesChannelProcessOutput
  > {
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

    // Check with name already exists
    if (input.name) {
      const existingSalesChannel = await this.db
        .selectFrom("sales_channels")
        .where("name", "ilike", input.name)
        .where("id", "!=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (existingSalesChannel) {
        throw new ValidationError("Sales channel name already exists", [{
          type: "already_exists",
          message: "Sales channel name already exists",
          path: "name",
        }]);
      }
    }

    return this.db
      .updateTable("sales_channels")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
