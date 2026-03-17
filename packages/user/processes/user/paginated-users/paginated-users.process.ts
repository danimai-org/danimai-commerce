import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedUsersProcessOutput,
  PaginatedUsersSchema,
} from "./paginated-users.schema";
import { type Static } from "@sinclair/typebox";
import { MeResponseSchema } from "../retrieve-user/retrieve-user.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_USERS_PROCESS = Symbol("PaginatedUsers");

@Process(PAGINATED_USERS_PROCESS)
export class PaginatedUsersProcess
  implements ProcessContract<
    typeof PaginatedUsersSchema,
    PaginatedUsersProcessOutput
  > {
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
    const {
      page = 1,
      limit = 10,
      sorting_field = "users.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("users")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (Number(page) - 1) * Number(limit);
    const rows = await query
      .selectAll()
      .limit(Number(limit))
      .offset(Number(offset))
      .execute();



    return paginationResponse<Static<typeof MeResponseSchema>>(rows, total, input);
  }
}
