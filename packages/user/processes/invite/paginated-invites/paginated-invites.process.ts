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
import { type PaginatedInvitesProcessInput, PaginatedInvitesSchema } from "./paginated-invites.schema";
import type { Database, Invite } from "../../../db/type";

export const PAGINATED_INVITES_PROCESS = Symbol("PaginatedInvites");

@Process(PAGINATED_INVITES_PROCESS)
export class PaginatedInvitesProcess
  implements ProcessContract<PaginationResponseType<Invite>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedInvitesSchema,
  }) context: ProcessContextType<typeof PaginatedInvitesSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    let query = this.db
      .selectFrom("invites")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = ["id", "email", "role", "accepted", "expires_at", "created_at", "updated_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";
    query = query.orderBy(sql.ref(`invites.${safeSortField}`), sortOrder);

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<Invite>(data, total, input);
  }
}
