import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateStoreProcessInput,
  UpdateStoreSchema,
} from "./update-stores.schema";
import type { Database, Store } from "@danimai/store/db";

export const UPDATE_STORES_PROCESS = Symbol("UpdateStores");

@Process(UPDATE_STORES_PROCESS)
export class UpdateStoresProcess implements ProcessContract<Store | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateStoreSchema })
    context: ProcessContextType<typeof UpdateStoreSchema>
  ) {
    const { input } = context;
    await this.validateStore(input);
    return this.updateStore(input);
  }

  async validateStore(input: UpdateStoreProcessInput) {
    const row = await this.db
      .selectFrom("stores")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Store not found", [
        { type: "not_found", message: "Store not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateStore(input: UpdateStoreProcessInput) {
    this.logger.info("Updating store", { input });
    const updateData: {
      name?: string;
      default_currency_code?: string | null;
      default_sales_channel_id?: string | null;
      default_region_id?: string | null;
      default_location_id?: string | null;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.default_currency_code !== undefined)
      updateData.default_currency_code = input.default_currency_code;
    if (input.default_sales_channel_id !== undefined)
      updateData.default_sales_channel_id = input.default_sales_channel_id;
    if (input.default_region_id !== undefined)
      updateData.default_region_id = input.default_region_id;
    if (input.default_location_id !== undefined)
      updateData.default_location_id = input.default_location_id;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("stores")
      .set({ ...updateData, updated_at: sql`now()` })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
