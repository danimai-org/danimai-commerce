import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateRefundProcessOutput,
  UpdateRefundSchema,
} from "./update-refund.schema";
import type { Database } from "../../../db/type";

/**
 * Updates a refund's status, reason, and/or metadata.
 * Input: refund id and optional last_status, metadata, refund_reason_id.
 * Output: updated refunds row.
 */
export const UPDATE_REFUND_PROCESS = Symbol("UpdateRefund");

@Process(UPDATE_REFUND_PROCESS)
export class UpdateRefundProcess
  implements
    ProcessContract<typeof UpdateRefundSchema, UpdateRefundProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdateRefundSchema })
    context: ProcessContextType<typeof UpdateRefundSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating refund", { id: input.id });

    const existingRefund = await this.db
      .selectFrom("refunds")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingRefund) {
      throw new NotFoundError("Refund not found");
    }

    if (input.refund_reason_id) {
      const refundReason = await this.db
        .selectFrom("refund_reasons")
        .where("id", "=", input.refund_reason_id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (!refundReason) {
        throw new ValidationError("Refund reason not found", [
          {
            type: "not_found",
            message: "Refund reason not found",
            path: "refund_reason_id",
          },
        ]);
      }
    }

    const update: Record<string, unknown> = { updated_at: sql`now()` };
    if (input.last_status !== undefined) {
      update.last_status = input.last_status;
    }
    if (input.metadata !== undefined) {
      update.metadata = input.metadata;
    }
    if (input.refund_reason_id !== undefined) {
      update.refund_reason_id = input.refund_reason_id;
    }

    return this.db
      .updateTable("refunds")
      .set(update)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
