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
  type DeleteRefundReasonsProcessOutput,
  DeleteRefundReasonsSchema,
} from "./delete-refund-reasons.schema";
import type { Database } from "../../../db/type";

/**
 * Soft-deletes refund reasons by id.
 * Input: refund_reason_ids array.
 * Output: void on success.
 */
export const DELETE_REFUND_REASONS_PROCESS = Symbol("DeleteRefundReasons");

@Process(DELETE_REFUND_REASONS_PROCESS)
export class DeleteRefundReasonsProcess
  implements
    ProcessContract<
      typeof DeleteRefundReasonsSchema,
      DeleteRefundReasonsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteRefundReasonsSchema })
    context: ProcessContextType<typeof DeleteRefundReasonsSchema>
  ) {
    const { input } = context;

    const reasons = await this.db
      .selectFrom("refund_reasons")
      .where("id", "in", input.refund_reason_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (reasons.length !== input.refund_reason_ids.length) {
      const foundIds = reasons.map((r) => r.id);
      const missingIds = input.refund_reason_ids.filter(
        (id) => !foundIds.includes(id)
      );
      throw new ValidationError(
        `Refund reasons not found: ${missingIds.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Refund reasons not found: ${missingIds.join(", ")}`,
            path: "refund_reason_ids",
          },
        ]
      );
    }

    this.logger.info("Deleting refund reasons", {
      refund_reason_ids: input.refund_reason_ids,
    });

    await this.db
      .updateTable("refund_reasons")
      .set({ deleted_at: new Date() })
      .where("id", "in", input.refund_reason_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
