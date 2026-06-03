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
  type CreateRefundReasonProcessOutput,
  CreateRefundReasonSchema,
} from "./create-refund-reason.schema";
import type { Database } from "../../../db/type";

/**
 * Creates a refund reason after validating value uniqueness.
 * Input: label, value, and optional metadata.
 * Output: created refund reason row.
 */
export const CREATE_REFUND_REASON_PROCESS = Symbol("CreateRefundReason");

@Process(CREATE_REFUND_REASON_PROCESS)
export class CreateRefundReasonProcess
  implements
    ProcessContract<
      typeof CreateRefundReasonSchema,
      CreateRefundReasonProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreateRefundReasonSchema })
    context: ProcessContextType<typeof CreateRefundReasonSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating refund reason", {
      label: input.label,
      value: input.value,
    });

    const existing = await this.db
      .selectFrom("refund_reasons")
      .where("value", "ilike", input.value)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existing) {
      throw new ValidationError("Refund reason value already exists", [
        {
          type: "already_exists",
          message: "Refund reason value already exists",
          path: "value",
        },
      ]);
    }

    return this.db
      .insertInto("refund_reasons")
      .values({
        label: input.label,
        value: input.value,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
