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

  const taxByLine = new Map<string, typeof taxLines>();
  for (const t of taxLines) {
    const lid = t.line_item_id;
    if (!lid) continue;
    const list = taxByLine.get(lid) ?? [];
    list.push(t);
    taxByLine.set(lid, list);
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

  return {
    ...cart,
    shipping_address,
    line_items: lineItems.map((li) => ({
      ...li,
      tax_lines: taxByLine.get(li.id) ?? [],
    })),
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
