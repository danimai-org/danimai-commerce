import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type CartWithRelations,
  type RetrieveCartProcessOutput,
  RetrieveCartSchema,
} from "./retrieve-cart.schema";
import type { Database } from "@danimai/cart/db";

/**
 * Helper: loadCartWithRelations.
 * Input: function parameters for query/shape logic.
 * Output: derived data used by the process flow.
 */
export async function loadCartWithRelations(
  db: Kysely<Database>,
  id: string
): Promise<CartWithRelations | undefined> {
  const toMoney = (value: string | null | undefined): number => {
    const n = Number.parseFloat(String(value ?? "0"));
    return Number.isFinite(n) ? n : 0;
  };
  const toMoneyString = (value: number): string =>
    (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);

  const cart = await db
    .selectFrom("carts")
    .where("id", "=", id)
    .where("deleted_at", "is", null)
    .selectAll()
    .executeTakeFirst();
  if (!cart) return undefined;

  const lineItems = await db
    .selectFrom("cart_line_items")
    .where("cart_id", "=", id)
    .where("deleted_at", "is", null)
    .selectAll()
    .execute();

  const lineIds = lineItems.map((l) => l.id);
  const taxLines =
    lineIds.length === 0
      ? []
      : await db
          .selectFrom("cart_line_item_tax_lines")
          .where("line_item_id", "in", lineIds)
          .where("deleted_at", "is", null)
          .selectAll()
          .execute();
  const adjustments =
    lineIds.length === 0
      ? []
      : await db
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
  for (const adj of adjustments) {
    const lid = adj.line_item_id;
    if (!lid) continue;
    const list = adjustmentsByLine.get(lid) ?? [];
    list.push(adj);
    adjustmentsByLine.set(lid, list);
  }

  let shipping_address: CartWithRelations["shipping_address"] = null;
  if (cart.shipping_address_id) {
    const addr = await db
      .selectFrom("cart_addresses")
      .where("id", "=", cart.shipping_address_id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    shipping_address = addr ?? null;
  }

  let subtotal = 0;
  let discountTotal = 0;
  const cartLineItems = lineItems.map((li) => {
    const quantity = Number(li.quantity ?? 0);
    const unitPrice = toMoney(li.unit_price);
    subtotal += quantity * unitPrice;
    const lineAdjustments = adjustmentsByLine.get(li.id) ?? [];
    discountTotal += lineAdjustments.reduce(
      (sum, adj) => sum + toMoney(adj.amount),
      0
    );
    return {
      ...li,
      adjustments: lineAdjustments,
      tax_lines: taxByLine.get(li.id) ?? [],
    };
  });
  const total = Math.max(0, subtotal - discountTotal);

  return {
    ...cart,
    shipping_address,
    line_items: cartLineItems,
    subtotal: toMoneyString(subtotal),
    discount_total: toMoneyString(discountTotal),
    total: toMoneyString(total),
  } as CartWithRelations;
}

/**
 * Handles the retrieve cart process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_CART_PROCESS = Symbol("RetrieveCart");

@Process(RETRIEVE_CART_PROCESS)
export class RetrieveCartProcess
  implements ProcessContract<typeof RetrieveCartSchema, RetrieveCartProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: RetrieveCartSchema })
    context: ProcessContextType<typeof RetrieveCartSchema>
  ) {
    const { input } = context;
    return loadCartWithRelations(this.db, input.id);
  }
}
