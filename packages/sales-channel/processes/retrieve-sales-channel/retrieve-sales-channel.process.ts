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

/**
 * Handles the retrieve sales channel process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
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

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
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
