import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  CreateOrdersSchema,
} from "./create-orders.schema";
import type { Database, Order } from "@danimai/order/db";
import {
  hasOrdersCartIdColumn,
  toOrderApiRow,
} from "../order-response.util";

/**
 * Handles the create orders process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_ORDERS_PROCESS = Symbol("CreateOrders");

/**
 * Creates multiple orders in one execution.
 * Input: an array of order payloads; each payload may optionally provide `display_id`.
 * Output: created order rows in input order.
 */
@Process(CREATE_ORDERS_PROCESS)
export class CreateOrdersProcess
  implements ProcessContract<typeof CreateOrdersSchema, Order[]>
{
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
    @ProcessContext({ schema: CreateOrdersSchema })
    context: ProcessContextType<typeof CreateOrdersSchema>
  ) {
    const { input } = context;
    const hasCartIdColumn = await hasOrdersCartIdColumn(this.db);
    return this.db.transaction().execute(async (trx) => {
      // Allocate display ids from one max() read to avoid per-order max lookups.
      const row = await trx
        .selectFrom("orders")
        .select(({ fn }) => fn.max<number>("display_id").as("max_id"))
        .executeTakeFirst();
      let nextDisplayId = Number(row?.max_id ?? 0) + 1;

      const created: Order[] = [];
      for (const orderInput of input.orders) {
        this.logger.info("Creating order", { input: orderInput });
        const displayId = orderInput.display_id ?? nextDisplayId++;

        const row = await trx
          .insertInto("orders")
          .values({
            currency_code: orderInput.currency_code,
            status: orderInput.status ?? "pending",
            fulfillment_status: orderInput.fulfillment_status ?? "not_fulfilled",
            payment_status: orderInput.payment_status ?? "not_paid",
            display_id: displayId,
            email: orderInput.email ?? null,
            customer_id: orderInput.customer_id ?? null,
            sales_channel_id: orderInput.sales_channel_id ?? null,
            region_id: orderInput.region_id ?? null,
            ...(hasCartIdColumn ? { cart_id: orderInput.cart_id ?? null } : {}),
            billing_address_id: orderInput.billing_address_id ?? null,
            shipping_address_id: orderInput.shipping_address_id ?? null,
            metadata: orderInput.metadata ?? null,
          })
          .returningAll()
          .executeTakeFirst();

        if (row) {
          const meta = orderInput.metadata;
          const rawItems =
            meta && typeof meta === "object" && meta !== null && Array.isArray((meta as { items?: unknown }).items)
              ? ((meta as { items: unknown[] }).items)
              : [];

          if (rawItems.length > 0) {
            await trx
              .insertInto("order_line_items")
              .values(
                rawItems.map((item) => {
                  const o =
                    item && typeof item === "object"
                      ? (item as Record<string, unknown>)
                      : {};
                  const unitPrice =
                    typeof o.price === "number"
                      ? String(o.price)
                      : typeof o.unit_price === "number"
                        ? String(o.unit_price)
                        : typeof o.unit_price === "string"
                          ? o.unit_price
                          : "0";
                  return {
                    order_id: row.id,
                    title: (o.title as string) ?? (o.product_title as string) ?? "Item",
                    description: null,
                    subtitle: null,
                    thumbnail: (o.thumbnail as string | null) ?? null,
                    variant_id: (o.id as string) ?? null,
                    product_id: null,
                    product_title: null,
                    product_description: null,
                    product_subtitle: null,
                    product_type: null,
                    product_collection: null,
                    product_handle: null,
                    variant_sku: (o.sku as string | null) ?? null,
                    variant_barcode: null,
                    variant_title: null,
                    variant_option_values: null,
                    requires_shipping: true,
                    is_discountable: true,
                    is_tax_inclusive: false,
                    compare_at_unit_price: null,
                    unit_price: unitPrice,
                    quantity: Math.max(1, Math.floor(Number(o.quantity) || 1)),
                    metadata: null,
                  };
                }),
              )
              .execute();
          }

          created.push(toOrderApiRow(row, hasCartIdColumn));
        }
      }

      return created;
    });
  }
}
