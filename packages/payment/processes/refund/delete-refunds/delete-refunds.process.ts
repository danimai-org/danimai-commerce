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
  type DeleteRefundsProcessOutput,
  DeleteRefundsSchema,
} from "./delete-refunds.schema";
import type { Database } from "../../../db/type";

/**
 * Soft-deletes refunds by id.
 * Input: refund_ids array.
 * Output: void on success.
 */
export const DELETE_REFUNDS_PROCESS = Symbol("DeleteRefunds");

@Process(DELETE_REFUNDS_PROCESS)
export class DeleteRefundsProcess
  implements
    ProcessContract<typeof DeleteRefundsSchema, DeleteRefundsProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteRefundsSchema })
    context: ProcessContextType<typeof DeleteRefundsSchema>
  ) {
    const { input } = context;

    const refunds = await this.db
      .selectFrom("refunds")
      .where("id", "in", input.refund_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (refunds.length !== input.refund_ids.length) {
      const foundIds = refunds.map((refund) => refund.id);
      const missingIds = input.refund_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(`Refunds not found: ${missingIds.join(", ")}`, [
        {
          type: "not_found",
          message: `Refunds not found: ${missingIds.join(", ")}`,
          path: "refund_ids",
        },
      ]);
    }

    this.logger.info("Deleting refunds", { refund_ids: input.refund_ids });

    await this.db
      .updateTable("refunds")
      .set({ deleted_at: new Date() })
      .where("id", "in", input.refund_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
