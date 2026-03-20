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
  CreateStoreSchema,
  type CreateStoreProcessOutput,
} from "./create-update-store.schema";
import type { Database } from "../../db";

export const CREATE_STORE_PROCESS = Symbol("CreateStore");

@Process(CREATE_STORE_PROCESS)
export class CreateStoreProcess implements ProcessContract<typeof CreateStoreSchema, CreateStoreProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateStoreSchema })
    context: ProcessContextType<typeof CreateStoreSchema>
  ) {
    const { input } = context;

    // Check if currency code is valid
    if (input.default_currency_code) {
      const currency = await this.db
        .selectFrom("currencies")
        .where("code", "=", input.default_currency_code)
        .selectAll()
        .executeTakeFirst();

      if (!currency) {
        throw new ValidationError("Currency code is not valid", [{
          type: "invalid",
          message: "Currency code is not valid",
          path: "default_currency_code",
        }]);
      }
    }

    // Check if sales channel is valid
    if (input.default_sales_channel_id) {
      const salesChannel = await this.db
        .selectFrom("sales_channels")
        .where("id", "=", input.default_sales_channel_id)
        .selectAll()
        .executeTakeFirst();
      if (!salesChannel) {
        throw new ValidationError("Sales channel is not valid", [{
          type: "invalid",
          message: "Sales channel is not valid",
          path: "default_sales_channel_id",
        }]);
      }
    }

    // Check if region is valid
    if (input.default_region_id) {
      const region = await this.db
        .selectFrom("regions")
        .where("id", "=", input.default_region_id)
        .selectAll()
        .executeTakeFirst();
      if (!region) {
        throw new ValidationError("Region is not valid", [{
          type: "invalid",
          message: "Region is not valid",
          path: "default_region_id",
        }]);
      }
    }

    // Check if location is valid
    if (input.default_location_id) {
      const location = await this.db
        .selectFrom("stock_locations")
        .where("id", "=", input.default_location_id)
        .selectAll()
        .executeTakeFirst();
      if (!location) {
        throw new ValidationError("Location is not valid", [{
          type: "invalid",
          message: "Location is not valid",
          path: "default_location_id",
        }]);
      }
    }
    return this.db
      .insertInto("stores")
      .values({
        name: input.name,
        default_currency_code: input.default_currency_code ?? null,
        default_sales_channel_id: input.default_sales_channel_id ?? null,
        default_region_id: input.default_region_id ?? null,
        default_location_id: input.default_location_id ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

  }

}
