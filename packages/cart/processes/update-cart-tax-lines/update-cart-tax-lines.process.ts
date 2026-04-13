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
  type UpdateCartTaxLinesProcessOutput,
  UpdateCartTaxLinesSchema,
  type UpdateCartTaxLinesProcessInput,
} from "./update-cart-tax-lines.schema";

/**
 * Handles the update cart tax lines process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_CART_TAX_LINES_PROCESS = Symbol("UpdateCartTaxLines");

type TaxLineIn =
  UpdateCartTaxLinesProcessInput["items"][number]["tax_lines"][number];

/**
 * Helper: taxLinePatch.
 * Input: function parameters for query/shape logic.
 * Output: derived data used by the process flow.
 */
function taxLinePatch(row: TaxLineIn): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (row.description !== undefined) patch.description = row.description;
  if (row.code !== undefined) patch.code = row.code;
  if (row.rate !== undefined) patch.rate = row.rate;
  if (row.provider_id !== undefined) patch.provider_id = row.provider_id;
  if (row.metadata !== undefined) patch.metadata = row.metadata;
  return patch;
}

/**
 * Updates tax lines for specific cart line items in one transaction.
 * Input: cart id and per-line-item tax line payloads.
 * Output: refreshed cart with line items and tax lines.
 */
@Process(UPDATE_CART_TAX_LINES_PROCESS)
export class UpdateCartTaxLinesProcess
  implements
    ProcessContract<typeof UpdateCartTaxLinesSchema, UpdateCartTaxLinesProcessOutput>
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
    @ProcessContext({ schema: UpdateCartTaxLinesSchema })
    context: ProcessContextType<typeof UpdateCartTaxLinesSchema>
  ) {
    const { input } = context;
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
          message: "Cannot modify tax lines on a completed cart",
          path: "id",
        },
      ]);
    }

    await this.db.transaction().execute(async (trx) => {
      const lineItemIds = input.items.map((item) => item.line_item_id);
      // Query once for all line items/tax lines to avoid per-item existence lookups (N+1).
      const existingLineItems = await trx
        .selectFrom("cart_line_items")
        .where("cart_id", "=", input.id)
        .where("id", "in", lineItemIds)
        .where("deleted_at", "is", null)
        .select("id")
        .execute();
      const existingLineItemIds = new Set(existingLineItems.map((row) => row.id));

      const existingTaxLines = lineItemIds.length
        ? await trx
            .selectFrom("cart_line_item_tax_lines")
            .where("line_item_id", "in", lineItemIds)
            .where("deleted_at", "is", null)
            .select(["id", "line_item_id"])
            .execute()
        : [];
      const existingTaxLineIdsByLineItem = new Map<string, Set<string>>();
      for (const row of existingTaxLines) {
        if (!row.line_item_id) continue;
        const ids = existingTaxLineIdsByLineItem.get(row.line_item_id) ?? new Set<string>();
        ids.add(row.id);
        existingTaxLineIdsByLineItem.set(row.line_item_id, ids);
      }

      for (const group of input.items) {
        if (!existingLineItemIds.has(group.line_item_id)) {
          throw new ValidationError("Line item not found on this cart", [
            {
              type: "not_found",
              message: "Line item not found on this cart",
              path: "items",
            },
          ]);
        }

        const keptIds = new Set(
          group.tax_lines
            .filter((t) => t.id != null && t.id !== "")
            .map((t) => t.id!)
        );

        if (keptIds.size === 0) {
          await trx
            .updateTable("cart_line_item_tax_lines")
            .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
            .where("line_item_id", "=", group.line_item_id)
            .where("deleted_at", "is", null)
            .execute();
        } else {
          await trx
            .updateTable("cart_line_item_tax_lines")
            .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
            .where("line_item_id", "=", group.line_item_id)
            .where("deleted_at", "is", null)
            .where("id", "not in", [...keptIds])
            .execute();
        }

        for (const tl of group.tax_lines) {
          if (tl.id) {
            const existingIds = existingTaxLineIdsByLineItem.get(group.line_item_id);
            if (!existingIds?.has(tl.id)) {
              throw new ValidationError("Tax line not found on this line item", [
                {
                  type: "not_found",
                  message: "Tax line not found on this line item",
                  path: "items",
                },
              ]);
            }
            const patch = taxLinePatch(tl);
            if (Object.keys(patch).length > 0) {
              await trx
                .updateTable("cart_line_item_tax_lines")
                .set({
                  ...patch,
                  updated_at: sql<Date>`now()`,
                } as never)
                .where("id", "=", tl.id)
                .execute();
            }
          } else {
            const hasCode = tl.code != null && tl.code !== "";
            const hasRate = tl.rate != null && tl.rate !== "";
            if (!hasCode || !hasRate) {
              throw new ValidationError(
                "New tax lines require code and rate",
                [
                  {
                    type: "invalid",
                    message: "New tax lines require code and rate",
                    path: "items",
                  },
                ]
              );
            }
            await trx
              .insertInto("cart_line_item_tax_lines")
              .values({
                line_item_id: group.line_item_id,
                description: tl.description ?? null,
                code: tl.code ?? null,
                rate: tl.rate ?? null,
                provider_id: tl.provider_id ?? null,
                metadata: tl.metadata ?? null,
              })
              .execute();
          }
        }
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
