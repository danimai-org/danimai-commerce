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
  type ListStoresProcessInput,
  ListStoresSchema,
} from "./list-stores.schema";
import type { Database, Store } from "@danimai/store/db";

export const LIST_STORES_PROCESS = Symbol("ListStores");

@Process(LIST_STORES_PROCESS)
export class ListStoresProcess implements ProcessContract<Store[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: ListStoresSchema })
    context: ProcessContextType<typeof ListStoresSchema>
  ) {
    const input = context.input as ListStoresProcessInput;

    let query = this.db
      .selectFrom("stores")
      .where("deleted_at", "is", null);

    if (input.name) {
      query = query.where("name", "ilike", `%${input.name}%`);
    }

    query = query.orderBy("name", "asc");

    if (input.limit !== undefined) {
      query = query.limit(input.limit);
    }
    if (input.offset !== undefined) {
      query = query.offset(input.offset);
    }

    const data = await query.selectAll().execute();
    return data;
  }
}
