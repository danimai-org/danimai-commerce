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
import { type PaginatedPermissionsProcessInput, PaginatedPermissionsSchema } from "./paginated-permissions.schema";
import type { Database, Permission } from "../../../db/type";

export const PAGINATED_PERMISSIONS_PROCESS = Symbol("PaginatedPermissions");

@Process(PAGINATED_PERMISSIONS_PROCESS)
export class PaginatedPermissionsProcess
  implements ProcessContract<PaginationResponseType<Permission>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedPermissionsSchema,
  }) context: ProcessContextType<typeof PaginatedPermissionsSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    let query = this.db
      .selectFrom("permissions")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = ["id", "name", "description", "created_at", "updated_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`permissions.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<Permission>(data, total, input);
  }
}
