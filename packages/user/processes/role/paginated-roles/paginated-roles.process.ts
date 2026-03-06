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
import { type PaginatedRolesProcessInput, PaginatedRolesSchema } from "./paginated-roles.schema";
import type { Database, Role } from "../../../db/type";

export const PAGINATED_ROLES_PROCESS = Symbol("PaginatedRoles");

@Process(PAGINATED_ROLES_PROCESS)
export class PaginatedRolesProcess
  implements ProcessContract<PaginationResponseType<Role>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedRolesSchema,
  }) context: ProcessContextType<typeof PaginatedRolesSchema> & { input: PaginatedRolesProcessInput }) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    let query = this.db
      .selectFrom("roles")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = ["id", "name", "description", "created_at", "updated_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`roles.${safeSortField}`), sortOrder);

    const offset = (pageNum - 1) * limitNum;
    const data = await query
      .selectAll()
      .limit(limitNum)
      .offset(offset)
      .execute();

    return paginationResponse<Role>(data, total, input);
  }
}
