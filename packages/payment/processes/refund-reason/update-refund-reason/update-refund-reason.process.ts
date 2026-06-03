import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateRefundReasonProcessOutput,
  UpdateRefundReasonSchema,
} from "./update-refund-reason.schema";
import type { Database } from "../../../db/type";

/**
 * Updates a refund reason by id.
 * Input: refund reason id and optional label, value, or metadata.
 * Output: updated refund reason row.
 */
export const UPDATE_REFUND_REASON_PROCESS = Symbol("UpdateRefundReason");

@Process(UPDATE_REFUND_REASON_PROCESS)
export class UpdateRefundReasonProcess
  implements
    ProcessContract<
      typeof UpdateRefundReasonSchema,
      UpdateRefundReasonProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdateRefundReasonSchema })
    context: ProcessContextType<typeof UpdateRefundReasonSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating refund reason", { id: input.id });

    const existing = await this.db
      .selectFrom("refund_reasons")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existing) {
      throw new ValidationError("Refund reason not found", [
        {
          type: "not_found",
          message: "Refund reason not found",
          path: "id",
        },
      ]);
    }

    if (input.value) {
      const duplicate = await this.db
        .selectFrom("refund_reasons")
        .where("value", "ilike", input.value)
        .where("id", "!=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (duplicate) {
        throw new ValidationError("Refund reason value already exists", [
          {
            type: "already_exists",
            message: "Refund reason value already exists",
            path: "value",
          },
        ]);
      }
    }

    const { id, label, value, metadata } = input;
    const updates: Record<string, unknown> = { updated_at: sql`now()` };

    if (label !== undefined) updates.label = label;
    if (value !== undefined) updates.value = value;
    if (metadata !== undefined) updates.metadata = metadata;

    return this.db
      .updateTable("refund_reasons")
      .set(updates)
      .where("id", "=", id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
