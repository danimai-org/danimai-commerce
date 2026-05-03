import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Database } from "@danimai/cart/db";
import { loadCartWithRelations } from "../retrieve-cart/retrieve-cart.process";
import {
  ApplyCartPromoCodeSchema,
  type ApplyCartPromoCodeProcessOutput,
} from "./apply-cart-promo-code.schema";

/**
 * Handles the apply cart promo code process.
 * Input: cart id and promo code.
 * Output: refreshed cart with promo adjustments applied.
 */
export const APPLY_CART_PROMO_CODE_PROCESS = Symbol("ApplyCartPromoCode");

const PROMO_PERCENT_BY_CODE: Record<string, number> = {
  SAVE10: 0.1,
  SAVE20: 0.2,
  WELCOME15: 0.15,
};

function toMoney(value: string | null | undefined): number {
  const n = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? n : 0;
}

function toMoneyString(value: number): string {
  return (Math.round((value + Number.EPSILON) * 100) / 100).toFixed(2);
}

@Process(APPLY_CART_PROMO_CODE_PROCESS)
export class ApplyCartPromoCodeProcess
  implements
    ProcessContract<typeof ApplyCartPromoCodeSchema, ApplyCartPromoCodeProcessOutput>
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
    @ProcessContext({ schema: ApplyCartPromoCodeSchema })
    context: ProcessContextType<typeof ApplyCartPromoCodeSchema>
  ) {
    const { input } = context;
    const normalizedCode = input.code.trim().toUpperCase();
    const percent = PROMO_PERCENT_BY_CODE[normalizedCode];
    if (!percent) {
      throw new ValidationError("Invalid promo code", [
        {
          type: "invalid",
          message: "Invalid promo code",
          path: "code",
        },
      ]);
    }

    const cart = await this.db
      .selectFrom("carts")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!cart) {
      throw new NotFoundError("Cart not found");
    }
    if (cart.completed_at != null) {
      throw new ValidationError("Cart is completed", [
        {
          type: "invalid_state",
          message: "Cannot apply promo code on a completed cart",
          path: "id",
        },
      ]);
    }

    await this.db.transaction().execute(async (trx) => {
      const lineItems = await trx
        .selectFrom("cart_line_items")
        .where("cart_id", "=", input.id)
        .where("deleted_at", "is", null)
        .select(["id", "quantity", "unit_price"])
        .execute();
      const lineItemIds = lineItems.map((li) => li.id);

      if (lineItemIds.length > 0) {
        await trx
          .updateTable("cart_line_item_adjustments")
          .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
          .where("line_item_id", "in", lineItemIds)
          .where("deleted_at", "is", null)
          .execute();
      }

      for (const line of lineItems) {
        const quantity = Number(line.quantity ?? 0);
        const unitPrice = toMoney(line.unit_price);
        const lineSubtotal = quantity * unitPrice;
        const amount = lineSubtotal * percent;
        if (amount <= 0) continue;
        await trx
          .insertInto("cart_line_item_adjustments")
          .values({
            line_item_id: line.id,
            code: normalizedCode,
            amount: toMoneyString(amount),
            description: `${normalizedCode} promo discount`,
            metadata: null,
          })
          .execute();
      }

      await trx
        .updateTable("carts")
        .set({ updated_at: sql<Date>`now()` })
        .where("id", "=", input.id)
        .execute();
    });

    return loadCartWithRelations(this.db, input.id);
  }
}
