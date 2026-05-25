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
import {
  hasOrdersCartIdColumn,
  toOrderApiRow,
} from "../order-response.util";

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

    const hasCartIdColumn = await hasOrdersCartIdColumn(this.db);
    const apiOrder = toOrderApiRow(order, hasCartIdColumn);

    const meta =
      typeof apiOrder.metadata === "object" && apiOrder.metadata !== null
        ? (apiOrder.metadata as Record<string, unknown>)
        : {};
    const metaItems = meta.items;
    const hasMetaItems = Array.isArray(metaItems) && metaItems.length > 0;

    if (hasMetaItems) {
      return apiOrder;
    }

    const lineItems = await this.db
      .selectFrom("order_line_items")
      .where("order_id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["id", "title", "thumbnail", "unit_price", "quantity", "variant_sku"])
      .execute();

    if (lineItems.length === 0) {
      return apiOrder;
    }

    return {
      ...apiOrder,
      metadata: {
        ...meta,
        items: lineItems.map((li) => ({
          id: li.id,
          title: li.title,
          price: Number.parseFloat(li.unit_price) || 0,
          quantity: li.quantity,
          currency: apiOrder.currency_code,
          thumbnail: li.thumbnail,
          sku: li.variant_sku,
        })),
      },
    };
  }
}
