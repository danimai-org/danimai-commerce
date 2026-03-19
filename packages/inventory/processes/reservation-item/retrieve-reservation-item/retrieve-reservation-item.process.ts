import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Database } from "../../../db";
import {
  RetrieveReservationItemSchema,
  type RetrieveReservationItemProcessOutput,
} from "./retrieve-reservation-item.schema";

export const RETRIEVE_RESERVATION_ITEM_PROCESS = Symbol("RetrieveReservationItem");

@Process(RETRIEVE_RESERVATION_ITEM_PROCESS)
export class RetrieveReservationItemProcess
  implements ProcessContract<
    typeof RetrieveReservationItemSchema,
    RetrieveReservationItemProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveReservationItemSchema })
    context: ProcessContextType<typeof RetrieveReservationItemSchema>
  ) {
    const { input } = context;

    return this.db
      .selectFrom("reservation_items")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirstOrThrow();
  }
}
