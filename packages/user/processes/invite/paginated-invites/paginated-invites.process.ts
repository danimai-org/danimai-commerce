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
  type PaginatedInvitesProcessOutput,
  PaginatedInvitesSchema,
} from "./paginated-invites.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_INVITES_PROCESS = Symbol("PaginatedInvites");

@Process(PAGINATED_INVITES_PROCESS)
export class PaginatedInvitesProcess
  implements ProcessContract<
    typeof PaginatedInvitesSchema,
    PaginatedInvitesProcessOutput
  > {
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
    const {
      page = 1,
      limit = 10,
      sorting_field = "invites.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("invites")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(
      data,
      total,
      input
    );
  }
}
