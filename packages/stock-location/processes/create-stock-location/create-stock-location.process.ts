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

/**
 * Handles the create stock location process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
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

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: CreateStockLocationSchema })
    context: ProcessContextType<typeof CreateStockLocationSchema>,
  ) {
    const { input } = context;
    this.logger.info("Creating stock location", { input });

    return this.db.transaction().execute(async (tx) => {
      const a = input.address;
      const address = await tx
        .insertInto("stock_location_addresses")
        .values({
          stock_location_id: null,
          address_1: a.address_1 ?? null,
          address_2: a.address_2 ?? null,
          company: a.company ?? null,
          city: a.city ?? null,
          province: a.province ?? null,
          postal_code: a.postal_code ?? null,
          country_code: a.country_code ?? null,
          phone: a.phone ?? null,
          metadata: null,
        })
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
