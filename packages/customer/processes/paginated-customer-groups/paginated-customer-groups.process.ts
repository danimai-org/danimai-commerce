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
import {
  type PaginatedCustomerGroupsProcessInput,
  PaginatedCustomerGroupsSchema,
} from "./paginated-customer-groups.schema";
import type { Database, CustomerGroup } from "../../db/type";

export const PAGINATED_CUSTOMER_GROUPS_PROCESS = Symbol("PaginatedCustomerGroups");

@Process(PAGINATED_CUSTOMER_GROUPS_PROCESS)
export class PaginatedCustomerGroupsProcess
  implements ProcessContract<PaginationResponseType<CustomerGroup>> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedCustomerGroupsSchema,
    })
    context: ProcessContextType<typeof PaginatedCustomerGroupsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("customer_groups")
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "name",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`customer_groups.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<CustomerGroup>(data, total, input);
  }
}
