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
  type UpdateCartLineItemsProcessOutput,
  UpdateCartLineItemsSchema,
  type UpdateCartLineItemsProcessInput,
} from "./update-cart-line-items.schema";

/**
 * Handles the update cart line items process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_CART_LINE_ITEMS_PROCESS = Symbol("UpdateCartLineItems");

type LineItemIn = UpdateCartLineItemsProcessInput["line_items"][number];

/**
 * Helper: lineItemPatch.
 * Input: function parameters for query/shape logic.
 * Output: derived data used by the process flow.
 */
function lineItemPatch(row: LineItemIn): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (row.title !== undefined) patch.title = row.title;
  if (row.description !== undefined) patch.description = row.description;
  if (row.thumbnail !== undefined) patch.thumbnail = row.thumbnail;
  if (row.variant_id !== undefined) patch.variant_id = row.variant_id;
  if (row.product_id !== undefined) patch.product_id = row.product_id;
  if (row.quantity !== undefined) patch.quantity = row.quantity;
  if (row.unit_price !== undefined) patch.unit_price = row.unit_price;
  if (row.metadata !== undefined) patch.metadata = row.metadata;
  return patch;
}

@Process(UPDATE_CART_LINE_ITEMS_PROCESS)
export class UpdateCartLineItemsProcess
  implements
    ProcessContract<typeof UpdateCartLineItemsSchema, UpdateCartLineItemsProcessOutput>
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
    @ProcessContext({ schema: UpdateCartLineItemsSchema })
    context: ProcessContextType<typeof UpdateCartLineItemsSchema>
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
          message: "Cannot modify line items on a completed cart",
          path: "id",
        },
      ]);
    }

    const keptIds = new Set(
      input.line_items.filter((i) => i.id != null && i.id !== "").map((i) => i.id!)
    );

    await this.db.transaction().execute(async (trx) => {
      if (keptIds.size === 0) {
        await trx
          .updateTable("cart_line_items")
          .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
          .where("cart_id", "=", input.id)
          .where("deleted_at", "is", null)
          .execute();
      } else {
        await trx
          .updateTable("cart_line_items")
          .set({ deleted_at: sql<Date>`now()`, updated_at: sql<Date>`now()` })
          .where("cart_id", "=", input.id)
          .where("deleted_at", "is", null)
          .where("id", "not in", [...keptIds])
          .execute();
      }

      for (const item of input.line_items) {
        if (item.id) {
          const existing = await trx
            .selectFrom("cart_line_items")
            .where("id", "=", item.id)
            .where("cart_id", "=", input.id)
            .where("deleted_at", "is", null)
            .select("id")
            .executeTakeFirst();
          if (!existing) {
            throw new ValidationError("Line item not found on this cart", [
              {
                type: "not_found",
                message: "Line item not found on this cart",
                path: "line_items",
              },
            ]);
          }
          const patch = lineItemPatch(item);
          if (Object.keys(patch).length > 0) {
            await trx
              .updateTable("cart_line_items")
              .set({
                ...patch,
                updated_at: sql<Date>`now()`,
              } as never)
              .where("id", "=", item.id)
              .execute();
          }
        } else {
          const hasTitle = item.title != null && item.title !== "";
          const hasVariant = item.variant_id != null && item.variant_id !== "";
          if (!hasTitle && !hasVariant) {
            throw new ValidationError(
              "New line items require title or variant_id",
              [
                {
                  type: "invalid",
                  message: "New line items require title or variant_id",
                  path: "line_items",
                },
              ]
            );
          }
          await trx
            .insertInto("cart_line_items")
            .values({
              cart_id: input.id,
              title: item.title ?? null,
              description: item.description ?? null,
              thumbnail: item.thumbnail ?? null,
              variant_id: item.variant_id ?? null,
              product_id: item.product_id ?? null,
              quantity: item.quantity ?? null,
              unit_price: item.unit_price ?? null,
              metadata: item.metadata ?? null,
            })
            .execute();
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
