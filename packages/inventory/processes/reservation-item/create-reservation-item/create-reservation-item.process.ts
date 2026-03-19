import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
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

  async runOperations(
    @ProcessContext({ schema: CreateReservationItemSchema })
    context: ProcessContextType<typeof CreateReservationItemSchema>
  ) {
    const { input } = context;
    const existingReservationItem = await this.db.selectFrom("reservation_items")
      .where("inventory_item_id", "=", input.inventory_item_id)
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

    return this.db
      .insertInto("reservation_items")
      .values(input)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
