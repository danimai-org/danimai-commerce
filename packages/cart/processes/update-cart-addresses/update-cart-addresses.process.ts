import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  jsonb,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Database } from "@danimai/cart/db";
import { loadCartWithRelations } from "../retrieve-cart/retrieve-cart.process";
import {
  type UpdateCartAddressesProcessOutput,
  UpdateCartAddressesSchema,
} from "./update-cart-addresses.schema";

/**
 * Handles the update cart addresses process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_CART_ADDRESSES_PROCESS = Symbol("UpdateCartAddresses");

@Process(UPDATE_CART_ADDRESSES_PROCESS)
export class UpdateCartAddressesProcess
  implements
    ProcessContract<typeof UpdateCartAddressesSchema, UpdateCartAddressesProcessOutput>
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
    @ProcessContext({ schema: UpdateCartAddressesSchema })
    context: ProcessContextType<typeof UpdateCartAddressesSchema>
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
          message: "Cannot modify addresses on a completed cart",
          path: "id",
        },
      ]);
    }

    const sa = input.shipping_address;
    const addressPatch = {
      address_1: sa.address_1,
      address_2: sa.address_2,
      company: sa.company,
      city: sa.city,
      province: sa.province,
      postal_code: sa.postal_code,
      country_code: sa.country_code,
      phone: sa.phone,
      metadata: sa.metadata !== undefined ? jsonb(sa.metadata) : undefined,
    };

    await this.db.transaction().execute(async (trx) => {
      let addressId = cart.shipping_address_id;

      if (addressId) {
        const existing = await trx
          .selectFrom("cart_addresses")
          .where("id", "=", addressId)
          .where("deleted_at", "is", null)
          .select("id")
          .executeTakeFirst();
        if (existing) {
          const definedPatch = Object.fromEntries(
            Object.entries(addressPatch).filter(([, v]) => v !== undefined)
          );
          if (Object.keys(definedPatch).length > 0) {
            await trx
              .updateTable("cart_addresses")
              .set({
                ...definedPatch,
                updated_at: sql<Date>`now()`,
              } as never)
              .where("id", "=", addressId)
              .execute();
          }
        } else {
          addressId = null;
        }
      }

      if (!addressId) {
        const inserted = await trx
          .insertInto("cart_addresses")
          .values({
            cart_id: input.id,
            address_1: sa.address_1 ?? null,
            address_2: sa.address_2 ?? null,
            company: sa.company ?? null,
            city: sa.city ?? null,
            province: sa.province ?? null,
            postal_code: sa.postal_code ?? null,
            country_code: sa.country_code ?? null,
            phone: sa.phone ?? null,
            metadata: jsonb(sa.metadata),
          })
          .returning("id")
          .executeTakeFirstOrThrow();

        await trx
          .updateTable("carts")
          .set({
            shipping_address_id: inserted.id,
            updated_at: sql<Date>`now()`,
          })
          .where("id", "=", input.id)
          .execute();
      } else {
        await trx
          .updateTable("carts")
          .set({ updated_at: sql<Date>`now()` })
          .where("id", "=", input.id)
          .execute();
      }
    });

    return loadCartWithRelations(this.db, input.id);
  }
}
