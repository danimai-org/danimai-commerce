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
  type UpdateCartRegionProcessOutput,
  UpdateCartRegionSchema,
} from "./update-cart-region.schema";

export const UPDATE_CART_REGION_PROCESS = Symbol("UpdateCartRegion");

@Process(UPDATE_CART_REGION_PROCESS)
export class UpdateCartRegionProcess implements ProcessContract<
  typeof UpdateCartRegionSchema,
  UpdateCartRegionProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) {}

  /**
   * Updates cart region and currency for storefront pricing.
   * Input: cart id, region_id, currency_code.
   * Output: cart with relations.
   */
  async runOperations(
    @ProcessContext({ schema: UpdateCartRegionSchema })
    context: ProcessContextType<typeof UpdateCartRegionSchema>,
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
          message: "Cannot update region on a completed cart",
          path: "id",
        },
      ]);
    }

    const currencyCode = input.currency_code.trim().toLowerCase();
    if (!currencyCode) {
      throw new ValidationError("currency_code is required", [
        {
          type: "invalid",
          message: "currency_code is required",
          path: "currency_code",
        },
      ]);
    }

    await this.db
      .updateTable("carts")
      .set({
        region_id: input.region_id,
        currency_code: currencyCode,
        updated_at: sql<Date>`now()`,
      })
      .where("id", "=", input.id)
      .execute();

    return loadCartWithRelations(this.db, input.id);
  }
}
