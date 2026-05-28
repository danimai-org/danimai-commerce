import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  DeleteReservationItemsSchema,
  type DeleteReservationItemsProcessOutput,
} from "./delete-reservation-items.schema";

/**
 * Handles the delete reservation items process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const DELETE_RESERVATION_ITEMS_PROCESS = Symbol("DeleteReservationItems");

@Process(DELETE_RESERVATION_ITEMS_PROCESS)
export class DeleteReservationItemsProcess
  implements ProcessContract<
    typeof DeleteReservationItemsSchema,
    DeleteReservationItemsProcessOutput
  > {
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
    @ProcessContext({ schema: DeleteReservationItemsSchema })
    context: ProcessContextType<typeof DeleteReservationItemsSchema>
  ) {
    const { input } = context;
    this.logger.info("Deleting reservation items", { ids: input.ids });

    const rows = await this.db
      .selectFrom("reservation_items")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .select(["id", "inventory_item_id", "location_id", "quantity"])
      .execute();

    if (rows.length !== input.ids.length) {
      throw new NotFoundError("Reservation items not found");
    }

    for (const reservation of rows) {
      const level = await this.db
        .selectFrom("inventory_levels")
        .where("inventory_item_id", "=", reservation.inventory_item_id)
        .where("location_id", "=", reservation.location_id)
        .where("deleted_at", "is", null)
        .select(["id", "available_quantity", "reserved_quantity"])
        .executeTakeFirst();

      if (level) {
        await this.db
          .updateTable("inventory_levels")
          .set({
            reserved_quantity: Math.max(0, level.reserved_quantity - reservation.quantity),
            available_quantity: level.available_quantity + reservation.quantity,
            updated_at: new Date(),
          })
          .where("id", "=", level.id)
          .execute();
      }
    }

    await this.db
      .updateTable("reservation_items")
      .set({ deleted_at: new Date(), updated_at: new Date() })
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
