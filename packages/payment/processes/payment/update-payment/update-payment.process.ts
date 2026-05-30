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
  type UpdatePaymentProcessOutput,
  UpdatePaymentSchema,
} from "./update-payment.schema";
import type { Database } from "../../../db/type";

/**
 * Updates a payment's status, transaction references, and/or metadata.
 * Input: payment id and optional last_status, last_transaction_id, success_transaction_id, metadata.
 * Output: updated payments row.
 */
export const UPDATE_PAYMENT_PROCESS = Symbol("UpdatePayment");

@Process(UPDATE_PAYMENT_PROCESS)
export class UpdatePaymentProcess
  implements
    ProcessContract<typeof UpdatePaymentSchema, UpdatePaymentProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdatePaymentSchema })
    context: ProcessContextType<typeof UpdatePaymentSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating payment", { id: input.id });

    const existingPayment = await this.db
      .selectFrom("payments")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existingPayment) {
      throw new NotFoundError("Payment not found");
    }

    if (input.last_transaction_id) {
      const transaction = await this.db
        .selectFrom("payment_transactions")
        .where("id", "=", input.last_transaction_id)
        .where("payment_id", "=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (!transaction) {
        throw new ValidationError("Last transaction not found for payment", [
          {
            type: "not_found",
            message: "Last transaction not found for payment",
            path: "last_transaction_id",
          },
        ]);
      }
    }

    if (input.success_transaction_id) {
      const transaction = await this.db
        .selectFrom("payment_transactions")
        .where("id", "=", input.success_transaction_id)
        .where("payment_id", "=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (!transaction) {
        throw new ValidationError("Success transaction not found for payment", [
          {
            type: "not_found",
            message: "Success transaction not found for payment",
            path: "success_transaction_id",
          },
        ]);
      }
    }

    const update: Record<string, unknown> = { updated_at: sql`now()` };
    if (input.last_status !== undefined) {
      update.last_status = input.last_status;
    }
    if (input.last_transaction_id !== undefined) {
      update.last_transaction_id = input.last_transaction_id;
    }
    if (input.success_transaction_id !== undefined) {
      update.success_transaction_id = input.success_transaction_id;
    }
    if (input.metadata !== undefined) {
      update.metadata = input.metadata;
    }

    return this.db
      .updateTable("payments")
      .set(update)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
