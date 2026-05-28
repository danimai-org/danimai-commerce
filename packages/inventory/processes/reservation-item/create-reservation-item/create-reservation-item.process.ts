import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  NotFoundError,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  CreateReservationItemSchema,
  type CreateReservationItemProcessOutput,
} from "./create-reservation-item.schema";

/**
 * Handles the create reservation item process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_RESERVATION_ITEM_PROCESS = Symbol("CreateReservationItem");

@Process(CREATE_RESERVATION_ITEM_PROCESS)
export class CreateReservationItemProcess
  implements ProcessContract<
    typeof CreateReservationItemSchema,
    CreateReservationItemProcessOutput
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
    @ProcessContext({ schema: CreateReservationItemSchema })
    context: ProcessContextType<typeof CreateReservationItemSchema>
  ) {
    const { input } = context;
    const level = await this.db
      .selectFrom("inventory_levels")
      .where("inventory_item_id", "=", input.inventory_item_id)
      .where("location_id", "=", input.location_id)
      .where("deleted_at", "is", null)
      .select(["id", "available_quantity", "reserved_quantity", "stocked_quantity"])
      .executeTakeFirst();

    if (!level) {
      throw new NotFoundError("Inventory level not found for this location");
    }

    if (input.quantity > level.available_quantity) {
      throw new ValidationError("Insufficient available quantity", [{
        type: "invalid",
        message: "Reservation quantity exceeds available quantity",
        path: "quantity",
      }]);
    }

    const reservation = await this.db
      .insertInto("reservation_items")
      .values(input)
      .returningAll()
      .executeTakeFirstOrThrow();

    await this.db
      .updateTable("inventory_levels")
      .set({
        reserved_quantity: level.reserved_quantity + input.quantity,
        available_quantity: level.available_quantity - input.quantity,
        updated_at: new Date(),
      })
      .where("id", "=", level.id)
      .execute();

    return reservation;
  }
}
