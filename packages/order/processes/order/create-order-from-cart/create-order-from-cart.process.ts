import type { Database as CartDatabase } from "@danimai/cart/db";
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
import type { Order } from "@danimai/order/db";
import { CreateOrderFromCartSchema } from "./create-order-from-cart.schema";

export const CREATE_ORDER_FROM_CART_PROCESS = Symbol("CreateOrderFromCart");

type Db = OrderDatabase &
  Pick<
    CartDatabase,
    "carts" | "cart_addresses" | "cart_line_items" | "cart_line_item_tax_lines"
  >;

@Process(CREATE_ORDER_FROM_CART_PROCESS)
export class CreateOrderFromCartProcess
  implements ProcessContract<typeof CreateOrderFromCartSchema, Order>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Db>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async getNextDisplayId(): Promise<number> {
    const row = await this.db
      .selectFrom("orders")
      .select(({ fn }) => fn.max<number>("display_id").as("max_id"))
      .executeTakeFirst();
    return (Number(row?.max_id ?? 0) + 1) as number;
  }

  async runOperations(
    @ProcessContext({ schema: CreateOrderFromCartSchema })
    context: ProcessContextType<typeof CreateOrderFromCartSchema>
  ): Promise<Order> {
    const { input } = context;
    this.logger.info("Creating order from cart", { cart_id: input.cart_id });

    const cart = await this.db
      .selectFrom("carts")
      .where("id", "=", input.cart_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!cart) {
      throw new NotFoundError("Cart not found");
    }
    if (cart.completed_at != null) {
      throw new ValidationError("Cart is already completed", [
        {
          type: "invalid_state",
          message: "Cart is already completed",
          path: "cart_id",
        },
      ]);
    }
    if (!cart.currency_code) {
      throw new ValidationError("Cart has no currency_code", [
        {
          type: "invalid",
          message: "Cart has no currency_code",
          path: "cart_id",
        },
      ]);
    }

    const lineItems = await this.db
      .selectFrom("cart_line_items")
      .where("cart_id", "=", input.cart_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (lineItems.length === 0) {
      throw new ValidationError("Cart has no line items", [
        {
          type: "invalid",
          message: "Cart has no line items",
          path: "cart_id",
        },
      ]);
    }

    const lineIds = lineItems.map((l) => l.id);
    const taxLines = await this.db
      .selectFrom("cart_line_item_tax_lines")
      .where("line_item_id", "in", lineIds)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    const taxByLine = new Map<string, typeof taxLines>();
    for (const t of taxLines) {
      const lid = t.line_item_id;
      if (!lid) continue;
      const list = taxByLine.get(lid) ?? [];
      list.push(t);
      taxByLine.set(lid, list);
    }

    const mergedMetadata =
      input.metadata != null
        ? {
            ...(typeof cart.metadata === "object" && cart.metadata !== null
              ? (cart.metadata as Record<string, unknown>)
              : {}),
            ...input.metadata,
          }
        : cart.metadata;

    const displayId = await this.getNextDisplayId();

    return this.db.transaction().execute(async (trx) => {
      let shippingAddrId: string | null = null;
      if (cart.shipping_address_id) {
        const ca = await trx
          .selectFrom("cart_addresses")
          .where("id", "=", cart.shipping_address_id)
          .where("deleted_at", "is", null)
          .selectAll()
          .executeTakeFirst();
        if (ca) {
          const inserted = await trx
            .insertInto("order_addresses")
            .values({
              first_name: "-",
              last_name: "-",
              phone: ca.phone ?? null,
              company: ca.company ?? null,
              address_1: ca.address_1 ?? "-",
              address_2: ca.address_2 ?? null,
              city: ca.city ?? "-",
              country_code: ca.country_code ?? "-",
              province: ca.province ?? null,
              postal_code: ca.postal_code ?? null,
              metadata: ca.metadata ?? null,
            })
            .returning("id")
            .executeTakeFirstOrThrow();
          shippingAddrId = inserted.id;
        }
      }

      const order = await trx
        .insertInto("orders")
        .values({
          currency_code: cart.currency_code,
          status: "pending",
          fulfillment_status: "not_fulfilled",
          payment_status: "not_paid",
          display_id: displayId,
          email: cart.email ?? null,
          customer_id: cart.customer_id ?? null,
          sales_channel_id: input.sales_channel_id ?? null,
          region_id: cart.region_id ?? null,
          cart_id: input.cart_id,
          billing_address_id: shippingAddrId,
          shipping_address_id: shippingAddrId,
          metadata: mergedMetadata ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      for (const li of lineItems) {
        const oli = await trx
          .insertInto("order_line_items")
          .values({
            order_id: order.id,
            title: li.title ?? "Item",
            description: li.description ?? null,
            subtitle: null,
            thumbnail: li.thumbnail ?? null,
            variant_id: li.variant_id ?? null,
            product_id: li.product_id ?? null,
            product_title: null,
            product_description: null,
            product_subtitle: null,
            product_type: null,
            product_collection: null,
            product_handle: null,
            variant_sku: null,
            variant_barcode: null,
            variant_title: null,
            variant_option_values: null,
            requires_shipping: true,
            is_discountable: true,
            is_tax_inclusive: false,
            compare_at_unit_price: null,
            unit_price: li.unit_price ?? "0",
            quantity: li.quantity ?? 1,
            metadata: li.metadata ?? null,
          })
          .returning("id")
          .executeTakeFirstOrThrow();

        const tls = taxByLine.get(li.id) ?? [];
        for (const tl of tls) {
          await trx
            .insertInto("order_line_item_tax_lines")
            .values({
              order_line_item_id: oli.id,
              description: tl.description ?? null,
              tax_rate_id: null,
              code: tl.code ?? null,
              rate: tl.rate ?? "0",
              provider_id: tl.provider_id ?? null,
              metadata: tl.metadata ?? null,
            })
            .execute();
        }
      }

      await trx
        .updateTable("carts")
        .set({
          completed_at: sql<string>`now()`,
          updated_at: sql<Date>`now()`,
        })
        .where("id", "=", input.cart_id)
        .execute();

      return order;
    });
  }
}
