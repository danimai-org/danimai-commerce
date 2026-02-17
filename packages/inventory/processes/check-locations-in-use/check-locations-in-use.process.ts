import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CheckLocationsInUseProcessInput,
  CheckLocationsInUseSchema,
} from "./check-locations-in-use.schema";
import type { Database } from "../../db/type";

export const CHECK_LOCATIONS_IN_USE_PROCESS = Symbol("CheckLocationsInUse");

@Process(CHECK_LOCATIONS_IN_USE_PROCESS)
export class CheckLocationsInUseProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: CheckLocationsInUseSchema })
    context: ProcessContextType<typeof CheckLocationsInUseSchema>
  ): Promise<void> {
    const { input } = context;
    if (input.location_ids.length === 0) return;

    const inUse = await this.db
      .selectFrom("inventory_levels")
      .select("location_id")
      .where("location_id", "in", input.location_ids)
      .where("deleted_at", "is", null)
      .limit(1)
      .execute();

    if (inUse.length > 0) {
      throw new ValidationError(
        "Please remove inventory items that are related to the location.",
        [
          {
            type: "location_in_use",
            message:
              "Please remove inventory items that are related to the location.",
            path: "stock_location_ids",
          },
        ]
      );
    }
  }
}
