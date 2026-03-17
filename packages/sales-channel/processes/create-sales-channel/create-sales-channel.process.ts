import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateSalesChannelProcessInput,
  type CreateSalesChannelProcessOutput,
  CreateSalesChannelSchema,
} from "./create-sales-channel.schema";
import type { Database, SalesChannel } from "@danimai/sales-channel/db";

export const CREATE_SALES_CHANNEL_PROCESS = Symbol("CreateSalesChannel");

@Process(CREATE_SALES_CHANNEL_PROCESS)
export class CreateSalesChannelProcess
  implements ProcessContract<
    typeof CreateSalesChannelSchema,
    CreateSalesChannelProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateSalesChannelSchema })
    context: ProcessContextType<typeof CreateSalesChannelSchema>
  ) {
    const { input } = context;

    // Check name is unique
    const existingSalesChannel = await this.db
      .selectFrom("sales_channels")
      .where("name", "ilike", input.name)
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
