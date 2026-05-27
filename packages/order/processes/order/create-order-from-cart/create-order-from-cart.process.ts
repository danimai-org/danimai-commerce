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
import type { Database as OrderDatabase, Order } from "@danimai/order/db";
import { CreateOrderFromCartSchema } from "./create-order-from-cart.schema";
import {
  parseAddressNames,
  snapshotFromCartLineItem,
} from "../order-snapshot.util";

/**
 * Handles the create order from cart process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_ORDER_FROM_CART_PROCESS = Symbol("CreateOrderFromCart");

type Db = OrderDatabase &
  Record<
    | "carts"
    | "cart_addresses"
    | "cart_line_items"
    | "cart_line_item_tax_lines"
    | "cart_line_item_adjustments",
    any
  >;

/**
 * Creates an order snapshot from a cart and marks the cart completed.
 * Input: `cart_id` plus optional `sales_channel_id` and metadata overrides.
 * Output: created order row with copied line items and tax lines.
 */
@Process(CREATE_ORDER_FROM_CART_PROCESS)
export class CreateOrderFromCartProcess implements ProcessContract<
  typeof CreateOrderFromCartSchema,
  Order
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Db>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async getNextDisplayId(): Promise<number> {
    const row = await this.db
      .selectFrom("orders")
      .select(({ fn }) => fn.max<number>("display_id").as("max_id"))
      .executeTakeFirst();
    return (Number(row?.max_id ?? 0) + 1) as number;
  }

  async hasOrdersCartIdColumn(): Promise<boolean> {
    const row = await sql<{ exists: boolean }>`
      select exists (
        select 1
        from information_schema.columns
        where table_name = 'orders'
          and column_name = 'cart_id'
      ) as exists
    `.execute(this.db);
    return Boolean(row.rows[0]?.exists);
  }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: CreateOrderFromCartSchema })
    context: ProcessContextType<typeof CreateOrderFromCartSchema>,
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
    const currencyCode = cart.currency_code;

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
    const adjustments =
      lineIds.length === 0
        ? []
        : await this.db
            .selectFrom("cart_line_item_adjustments")
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
    const adjustmentsByLine = new Map<string, typeof adjustments>();
    for (const adjustment of adjustments) {
      const lid = adjustment.line_item_id;
      if (!lid) continue;
      const list = adjustmentsByLine.get(lid) ?? [];
      list.push(adjustment);
      adjustmentsByLine.set(lid, list);
    }

    const appliedPromoCodes = [
      ...new Set(adjustments.map((adj) => adj.code).filter(Boolean)),
    ] as string[];

    const mergedMetadata =
      input.metadata != null
        ? {
            ...(typeof cart.metadata === "object" && cart.metadata !== null
              ? (cart.metadata as Record<string, unknown>)
              : {}),
            ...input.metadata,
            ...(appliedPromoCodes.length > 0
              ? { applied_promo_codes: appliedPromoCodes }
              : {}),
          }
        : {
            ...(typeof cart.metadata === "object" && cart.metadata !== null
              ? (cart.metadata as Record<string, unknown>)
              : {}),
            ...(appliedPromoCodes.length > 0
              ? { applied_promo_codes: appliedPromoCodes }
              : {}),
          };

    const displayId = await this.getNextDisplayId();

    // Neon serverless: no Kysely interactive transactions.
    const db = this.db;
    let shippingAddrId: string | null = null;
    if (cart.shipping_address_id) {
      const ca = await db
        .selectFrom("cart_addresses")
        .where("id", "=", cart.shipping_address_id)
        .where("deleted_at", "is", null)
        .selectAll()
        .executeTakeFirst();
      if (ca) {
        const names = parseAddressNames(ca.metadata);
        const inserted = await db
          .insertInto("order_addresses")
          .values({
            first_name: names.firstName,
            last_name: names.lastName,
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

    const checkoutEmail =
      typeof mergedMetadata === "object" &&
      mergedMetadata !== null &&
      typeof (mergedMetadata as Record<string, unknown>).checkout_email ===
        "string"
        ? String((mergedMetadata as Record<string, unknown>).checkout_email)
        : null;

    const hasCartIdColumn = await this.hasOrdersCartIdColumn();
    const order = await db
      .insertInto("orders")
      .values({
        currency_code: currencyCode,
        status: "pending",
        fulfillment_status: "not_fulfilled",
        payment_status: "not_paid",
        display_id: displayId,
        email: checkoutEmail ?? cart.email ?? null,
        customer_id: cart.customer_id ?? null,
        sales_channel_id: input.sales_channel_id ?? null,
        region_id: cart.region_id ?? null,
        ...(hasCartIdColumn ? ({ cart_id: input.cart_id } as const) : {}),
        billing_address_id: shippingAddrId ?? undefined,
        shipping_address_id: shippingAddrId ?? undefined,
        metadata: mergedMetadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const createdOrderLineItems = await db
      .insertInto("order_line_items")
      .values(
        lineItems.map((li) => {
          const snapshot = snapshotFromCartLineItem(li);
          return {
            order_id: order.id,
            title: snapshot.productTitle ?? li.title ?? "Item",
            description: li.description ?? null,
            subtitle: null,
            thumbnail: li.thumbnail ?? null,
            variant_id: li.variant_id ?? null,
            product_id: li.product_id ?? null,
            product_title: snapshot.productTitle,
            product_description: null,
            product_subtitle: null,
            product_type: null,
            product_collection: null,
            product_handle: snapshot.productHandle,
            variant_sku: snapshot.variantSku,
            variant_barcode: null,
            variant_title: snapshot.variantTitle,
            variant_option_values: snapshot.variantOptionValues,
            requires_shipping: true,
            is_discountable: true,
            is_tax_inclusive: false,
            compare_at_unit_price: null,
            unit_price: li.unit_price ?? "0",
            quantity: li.quantity ?? 1,
            metadata: li.metadata ?? null,
          };
        }),
      )
      .returning("id")
      .execute();

    // Keep line-item to inserted-order-line-item mapping deterministic by input index.
    const orderLineIdByCartLineId = new Map<string, string>();
    for (let index = 0; index < lineItems.length; index++) {
      const sourceLineItem = lineItems[index];
      const insertedLineItem = createdOrderLineItems[index];
      if (sourceLineItem && insertedLineItem) {
        orderLineIdByCartLineId.set(sourceLineItem.id, insertedLineItem.id);
      }
    }

    const orderTaxLinesToInsert = lineItems.flatMap((li) => {
      const orderLineItemId = orderLineIdByCartLineId.get(li.id);
      if (!orderLineItemId) return [];
      return (taxByLine.get(li.id) ?? []).map((tl) => ({
        order_line_item_id: orderLineItemId,
        description: tl.description ?? null,
        tax_rate_id: null,
        code: tl.code ?? null,
        rate: tl.rate ?? "0",
        provider_id: tl.provider_id ?? null,
        metadata: tl.metadata ?? null,
      }));
    });

    if (orderTaxLinesToInsert.length > 0) {
      await db
        .insertInto("order_line_item_tax_lines")
        .values(orderTaxLinesToInsert)
        .execute();
    }

    const orderAdjustmentsToInsert = lineItems.flatMap((li) => {
      const orderLineItemId = orderLineIdByCartLineId.get(li.id);
      if (!orderLineItemId) return [];
      return (adjustmentsByLine.get(li.id) ?? []).map((adj) => {
        const metadata =
          typeof adj.metadata === "object" && adj.metadata !== null
            ? (adj.metadata as Record<string, unknown>)
            : null;
        const promotionId =
          metadata && typeof metadata.promotion_id === "string"
            ? metadata.promotion_id
            : null;
        return {
          order_line_item_id: orderLineItemId,
          code: adj.code ?? null,
          amount: adj.amount ?? "0",
          description: adj.description ?? null,
          promotion_id: promotionId,
          provider_id: null,
          metadata: adj.metadata ?? null,
        };
      });
    });

    if (orderAdjustmentsToInsert.length > 0) {
      await db
        .insertInto("order_line_item_adjustments")
        .values(orderAdjustmentsToInsert)
        .execute();
    }

    await db
      .updateTable("carts")
      .set({
        completed_at: sql<string>`now()`,
        updated_at: sql<Date>`now()`,
      })
      .where("id", "=", input.cart_id)
      .execute();

    return {
      ...order,
      cart_id: input.cart_id,
    } as Order;
  }
}
