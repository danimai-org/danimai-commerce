import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type ListAndCountStoresProcessInput,
  ListAndCountStoresSchema,
} from "./list-and-count-stores.schema";
import type { Database, Store } from "@danimai/store/db";

export const LIST_AND_COUNT_STORES_PROCESS = Symbol("ListAndCountStores");

@Process(LIST_AND_COUNT_STORES_PROCESS)
export class ListAndCountStoresProcess
  implements ProcessContract<[Store[], number]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: ListAndCountStoresSchema })
    context: ProcessContextType<typeof ListAndCountStoresSchema>
  ): Promise<[Store[], number]> {
    const input = context.input as ListAndCountStoresProcessInput;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let baseQuery = this.db
      .selectFrom("stores")
      .where("deleted_at", "is", null);

    if (input.name) {
      baseQuery = baseQuery.where("name", "ilike", `%${input.name}%`);
    }

    const countResult = await baseQuery
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const count = Number(countResult?.count ?? 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "default_currency_code",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field ?? "")
      ? sorting_field
      : "created_at";

    const offset = (page - 1) * limit;
    const data = await baseQuery
      .orderBy(sql.ref(`stores.${safeSortField}`), sortOrder)
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return [data, count];
  }
}
