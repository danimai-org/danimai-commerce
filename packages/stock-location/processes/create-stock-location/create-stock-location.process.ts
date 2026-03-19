import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateStockLocationProcessOutput,
  CreateStockLocationSchema,
} from "./create-stock-location.schema";
import type { Database } from "../../db";

export const CREATE_STOCK_LOCATION_PROCESS = Symbol("CreateStockLocation");

@Process(CREATE_STOCK_LOCATION_PROCESS)
export class CreateStockLocationProcess
  implements ProcessContract<
    typeof CreateStockLocationSchema,
    CreateStockLocationProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateStockLocationSchema })
    context: ProcessContextType<typeof CreateStockLocationSchema>,
  ) {
    const { input } = context;
    this.logger.info("Creating stock location", { input });

    return this.db.transaction().execute(async (tx) => {
      const address = await tx
        .insertInto("stock_location_addresses")
        .values(input.address)
        .returningAll()
        .executeTakeFirst();

      if (!address) {
        throw new ValidationError("Failed to create address",
          [{
            type: "invalid",
            message: "Failed to create address",
            path: "address",
          }]);
      }

      const location = await tx
        .insertInto("stock_locations")
        .values({
          name: input.name ?? null,
          address_id: address.id,
          metadata: input.metadata ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      return location;
    });
  }
}
