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
  ListCustomerAddressesSchema,
} from "./list-customer-addresses.schema";
import type { Database, CustomerAddress } from "../../../db/type";

/**
 * Handles the list customer addresses process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const LIST_CUSTOMER_ADDRESSES_PROCESS = Symbol("ListCustomerAddresses");

@Process(LIST_CUSTOMER_ADDRESSES_PROCESS)
export class ListCustomerAddressesProcess
  implements ProcessContract<PaginationResponseType<CustomerAddress>>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({
      schema: ListCustomerAddressesSchema,
    })
    context: ProcessContextType<typeof ListCustomerAddressesSchema>
  ) {
    const { input } = context;
    const {
      customer_id,
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
    } = input;

    let query = this.db
      .selectFrom("customer_addresses")
      .where("customer_id", "=", customer_id)
      .where("deleted_at", "is", null);

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    const sortOrder =
      sorting_direction === SortOrder.ASC ? "asc" : "desc";
    const allowedSortFields = [
      "id",
      "first_name",
      "last_name",
      "city",
      "country_code",
      "is_default",
      "created_at",
      "updated_at",
    ];
    const safeSortField = allowedSortFields.includes(sorting_field)
      ? sorting_field
      : "created_at";
    query = query.orderBy(
      sql.ref(`customer_addresses.${safeSortField}`),
      sortOrder
    );

    const offset = (page - 1) * limit;
    const data = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse<CustomerAddress>(data, total, input);
  }
}
