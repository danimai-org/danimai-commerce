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
import type { Logger } from "@logtape/logtape";
import { Kysely, sql } from "kysely";
import type { Database } from "../../../db";
import {
  UpdateReservationItemSchema,
  type UpdateReservationItemProcessOutput,
} from "./update-reservation-item.schema";

/**
 * Handles the update reservation item process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_RESERVATION_ITEM_PROCESS = Symbol("UpdateReservationItem");

@Process(UPDATE_RESERVATION_ITEM_PROCESS)
export class UpdateReservationItemProcess
  implements ProcessContract<
    typeof UpdateReservationItemSchema,
    UpdateReservationItemProcessOutput
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
    @ProcessContext({ schema: UpdateReservationItemSchema })
    context: ProcessContextType<typeof UpdateReservationItemSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating reservation item", { input });

    const item = await this.db.selectFrom("reservation_items")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["inventory_item_id", "id", "location_id", "quantity"])
      .executeTakeFirst();

    if (!item) {
      throw new NotFoundError("Reservation item not found");
    }

    const nextLocationId = input.location_id ?? item.location_id;
    const nextQuantity = input.quantity ?? item.quantity;
    const movedLocation = nextLocationId !== item.location_id;
    const quantityDelta = nextQuantity - item.quantity;

    const targetLevel = await this.db
      .selectFrom("inventory_levels")
      .where("inventory_item_id", "=", item.inventory_item_id)
      .where("location_id", "=", nextLocationId)
      .where("deleted_at", "is", null)
      .select(["id", "available_quantity", "reserved_quantity", "stocked_quantity"])
      .executeTakeFirst();

    if (!targetLevel) {
      throw new ValidationError("Target inventory level not found", [{
        type: "not_found",
        message: "Target inventory level not found",
        path: "location_id",
      }]);
    }

    if (movedLocation) {
      if (nextQuantity > targetLevel.available_quantity) {
        throw new ValidationError("Insufficient available quantity", [{
          type: "invalid",
          message: "Reservation quantity exceeds available quantity at target location",
          path: "quantity",
        }]);
      }
    } else if (quantityDelta > 0 && quantityDelta > targetLevel.available_quantity) {
      throw new ValidationError("Insufficient available quantity", [{
        type: "invalid",
        message: "Reservation quantity exceeds available quantity",
        path: "quantity",
      }]);
    }

    const updatedReservation = await this.db
      .updateTable("reservation_items")
      .set({
        ...input,
        id: undefined,
        updated_at: sql`now()`,
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirstOrThrow();

    if (movedLocation) {
      const sourceLevel = await this.db
        .selectFrom("inventory_levels")
        .where("inventory_item_id", "=", item.inventory_item_id)
        .where("location_id", "=", item.location_id)
        .where("deleted_at", "is", null)
        .select(["id", "available_quantity", "reserved_quantity"])
        .executeTakeFirst();

      if (!sourceLevel) {
        throw new ValidationError("Source inventory level not found", [{
          type: "not_found",
          message: "Source inventory level not found",
          path: "location_id",
        }]);
      }

      await this.db
        .updateTable("inventory_levels")
        .set({
          reserved_quantity: Math.max(0, sourceLevel.reserved_quantity - item.quantity),
          available_quantity: sourceLevel.available_quantity + item.quantity,
          updated_at: new Date(),
        })
        .where("id", "=", sourceLevel.id)
        .execute();

      await this.db
        .updateTable("inventory_levels")
        .set({
          reserved_quantity: targetLevel.reserved_quantity + nextQuantity,
          available_quantity: targetLevel.available_quantity - nextQuantity,
          updated_at: new Date(),
        })
        .where("id", "=", targetLevel.id)
        .execute();

      return updatedReservation;
    }

    if (quantityDelta !== 0) {
      await this.db
        .updateTable("inventory_levels")
        .set({
          reserved_quantity: targetLevel.reserved_quantity + quantityDelta,
          available_quantity: targetLevel.available_quantity - quantityDelta,
          updated_at: new Date(),
        })
        .where("id", "=", targetLevel.id)
        .execute();
    }

    return updatedReservation;
  }
}
