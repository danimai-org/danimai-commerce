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
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type ListCustomersInGroupProcessInput,
  ListCustomersInGroupSchema,
} from "./list-customers-in-group.schema";
import type { Database, Customer } from "../../db/type";

export const LIST_CUSTOMERS_IN_GROUP_PROCESS = Symbol("ListCustomersInGroup");

@Process(LIST_CUSTOMERS_IN_GROUP_PROCESS)
export class ListCustomersInGroupProcess
  implements ProcessContract<PaginationResponseType<Customer>>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: ListCustomersInGroupSchema,
    })
    context: ProcessContextType<typeof ListCustomersInGroupSchema>
  ) {
    const { input } = context;
    const {
      customer_group_id,
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    // Verify group exists
    const group = await this.db
      .selectFrom("customer_groups")
      .where("id", "=", customer_group_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!group) {
      throw new ValidationError("Customer group not found", [
        {
          type: "not_found",
          message: "Customer group not found",
          path: "customer_group_id",
        },
      ]);
    }

    let query = this.db
      .selectFrom("customers")
      .innerJoin(
        "customer_group_customers",
        "customer_group_customers.customer_id",
        "customers.id"
      )
      .where("customer_group_customers.customer_group_id", "=", customer_group_id)
      .where("customers.deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("customers.id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "email",
      "first_name",
      "last_name",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`customers.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll("customers")
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<Customer>(data, total, input);
  }
}
