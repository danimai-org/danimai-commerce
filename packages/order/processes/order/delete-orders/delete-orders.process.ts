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
  type DeleteOrdersProcessInput,
  DeleteOrdersSchema,
} from "./delete-orders.schema";
import type { Database } from "@danimai/order/db";

export const DELETE_ORDERS_PROCESS = Symbol("DeleteOrders");

@Process(DELETE_ORDERS_PROCESS)
export class DeleteOrdersProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteOrdersSchema })
    context: ProcessContextType<typeof DeleteOrdersSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateOrders(input);
    await this.deleteOrders(input);
  }

  async validateOrders(input: DeleteOrdersProcessInput) {
    const rows = await this.db
      .selectFrom("orders")
      .where("id", "in", input.order_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.order_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.order_ids.filter((id) => !found.includes(id));
      throw new ValidationError(`Orders not found: ${missing.join(", ")}`, [
        {
          type: "not_found",
          message: `Orders not found: ${missing.join(", ")}`,
          path: "order_ids",
        },
      ]);
    }
    return rows;
  }

  async deleteOrders(input: DeleteOrdersProcessInput) {
    this.logger.info("Deleting orders", { order_ids: input.order_ids });
    await this.db
      .updateTable("orders")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.order_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
