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
  type PaginatedRolesProcessOutput,
  PaginatedRolesSchema,
} from "./paginated-roles.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the paginated roles process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const PAGINATED_ROLES_PROCESS = Symbol("PaginatedRoles");

@Process(PAGINATED_ROLES_PROCESS)
export class PaginatedRolesProcess
  implements ProcessContract<
    typeof PaginatedRolesSchema,
    PaginatedRolesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: PaginatedRolesSchema,
  }) context: ProcessContextType<typeof PaginatedRolesSchema>) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "roles.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;
    const pageNum = Number(page);
    const limitNum = Number(limit);

    let query = this.db
      .selectFrom("roles")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (pageNum - 1) * limitNum;
    const data = await query
      .selectAll()
      .limit(limitNum)
      .offset(offset)
      .execute();

    return paginationResponse(data, total, input);
  }
}
