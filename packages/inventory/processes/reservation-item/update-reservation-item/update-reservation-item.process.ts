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

  async runOperations(
    @ProcessContext({ schema: UpdateReservationItemSchema })
    context: ProcessContextType<typeof UpdateReservationItemSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating reservation item", { input });

    const item = await this.db.selectFrom("reservation_items")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select(["inventory_item_id", "id"])
      .executeTakeFirst();

    if (!item) {
      throw new NotFoundError("Reservation item not found");
    }

    if (input.location_id) {
      const existingReservationItem = await this.db.selectFrom("reservation_items")
        .where("id", "!=", input.id)
        .where("inventory_item_id", "=", item.inventory_item_id)
        .where("location_id", "=", input.location_id)
        .select("id")
        .executeTakeFirst();

      if (existingReservationItem) {
        throw new ValidationError("Reservation item already exists", [{
          type: "already_exists",
          message: "Reservation item already exists for this inventory item and location",
          path: "location_id",
        }]);
      }
    }

    return this.db
      .updateTable("reservation_items")
      .set({
        ...input,
        id: undefined,
        updated_at: sql`now()`,
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
