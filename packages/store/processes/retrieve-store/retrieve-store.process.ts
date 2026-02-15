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
  type RetrieveStoreProcessInput,
  RetrieveStoreSchema,
} from "./retrieve-store.schema";
import type { Database, Store } from "@danimai/store/db";

export const RETRIEVE_STORE_PROCESS = Symbol("RetrieveStore");

@Process(RETRIEVE_STORE_PROCESS)
export class RetrieveStoreProcess implements ProcessContract<Store> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: RetrieveStoreSchema })
    context: ProcessContextType<typeof RetrieveStoreSchema>
  ): Promise<Store> {
    const { input } = context;

    const store = await this.db
      .selectFrom("stores")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!store) {
      throw new ValidationError("Store not found", [
        {
          type: "not_found",
          message: "Store not found",
          path: "id",
        },
      ]);
    }

    return store;
  }
}
