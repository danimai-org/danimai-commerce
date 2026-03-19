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
      .select("id")
      .execute();

    if (rows.length !== input.ids.length) {
      throw new NotFoundError("Reservation items not found");
    }

    await this.db
      .deleteFrom("reservation_items")
      .where("id", "in", input.ids)
      .execute();
  }
}
