import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateStoreProcessInput,
  CreateStoresSchema,
} from "./create-stores.schema";
import type { Database, Store } from "@danimai/store/db";

export const CREATE_STORES_PROCESS = Symbol("CreateStores");

@Process(CREATE_STORES_PROCESS)
export class CreateStoresProcess implements ProcessContract<Store[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateStoresSchema })
    context: ProcessContextType<typeof CreateStoresSchema>
  ) {
    const { input } = context;
    const created: Store[] = [];
    for (const s of input.stores) {
      const row = await this.createStore(s);
      if (row) created.push(row);
    }
    return created;
  }

  async createStore(input: CreateStoreProcessInput) {
    this.logger.info("Creating store", { input });
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
      .executeTakeFirst();
  }
}
