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
import type { Database, Order } from "../../../db/type";
import { RetrieveOrderSchema } from "./retrieve-order.schema";

/**
 * Handles the retrieve order process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_ORDER_PROCESS = Symbol("RetrieveOrder");

@Process(RETRIEVE_ORDER_PROCESS)
export class RetrieveOrderProcess
  implements ProcessContract<typeof RetrieveOrderSchema, Order> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: RetrieveOrderSchema })
    context: ProcessContextType<typeof RetrieveOrderSchema>
  ) {
    const { input } = context;

    const order = await this.db
      .selectFrom("orders")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!order) {
      throw new ValidationError("Order not found", [
        {
          type: "not_found",
          message: "Order not found",
          path: "id",
        },
      ]);
    }

    return order;
  }
}
