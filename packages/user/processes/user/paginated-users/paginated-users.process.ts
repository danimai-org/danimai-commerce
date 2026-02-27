import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  type PaginationResponseType,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type PaginatedUsersProcessInput, PaginatedUsersSchema } from "./paginated-users.schema";
import type { Database, User } from "../../../db/type";

export const PAGINATED_USERS_PROCESS = Symbol("PaginatedUsers");

@Process(PAGINATED_USERS_PROCESS)
export class PaginatedUsersProcess
  implements ProcessContract<PaginationResponseType<User>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedUsersSchema,
  }) context: ProcessContextType<typeof PaginatedUsersSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    let query = this.db
      .selectFrom("users")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = ["id", "email", "first_name", "last_name", "created_at", "updated_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`users.${safeSortField}`), sortOrder);

    const offset = (Number(page) - 1) * Number(limit);
    const rows = await query
      .selectAll()
      .limit(Number(limit))
      .offset(Number(offset))
      .execute();

    const toDateString = (v: string | Date): string =>
      v instanceof Date ? v.toISOString() : v;
    const toDateStringOrNull = (v: string | Date | null): string | null =>
      v == null ? null : v instanceof Date ? v.toISOString() : v;

    const data = rows.map((row) => {
      const r = row as User & {
        created_at: string | Date;
        updated_at: string | Date;
        deleted_at: string | Date | null;
      };
      return {
        ...row,
        created_at: toDateString(r.created_at),
        updated_at: toDateString(r.updated_at),
        deleted_at: toDateStringOrNull(r.deleted_at),
      };
    });

    return paginationResponse<User>(data, total, input);
  }
}
