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
  type PaginatedPaymentsProcessOutput,
  PaginatedPaymentsSchema,
} from "./paginated-payments.schema";
import type { Database } from "../../../db/type";

/**
 * Lists payments with pagination and optional filters.
 * Input: pagination params and optional filters (order_id, provider_id, customer_id, currency_code, last_status, amount range).
 * Output: paginated payment rows and metadata.
 */
export const PAGINATED_PAYMENTS_PROCESS = Symbol("PaginatedPayments");

@Process(PAGINATED_PAYMENTS_PROCESS)
export class PaginatedPaymentsProcess
  implements
    ProcessContract<
      typeof PaginatedPaymentsSchema,
      PaginatedPaymentsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedPaymentsSchema })
    context: ProcessContextType<typeof PaginatedPaymentsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "payments.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;
    const {
      order_id,
      provider_id,
      customer_id,
      currency_code,
      last_status,
      amount_greater_than,
      amount_less_than,
    } = input.filters ?? {};

    let query = this.db
      .selectFrom("payments")
      .where("deleted_at", "is", null);

    if (order_id !== undefined) {
      query = query.where("order_id", "=", order_id);
    }
    if (provider_id !== undefined) {
      query = query.where("provider_id", "=", provider_id);
    }
    if (customer_id !== undefined) {
      query = query.where("customer_id", "=", customer_id);
    }
    if (currency_code !== undefined) {
      query = query.where("currency_code", "=", currency_code);
    }
    if (last_status !== undefined) {
      query = query.where("last_status", "=", last_status);
    }
    if (amount_greater_than !== undefined) {
      query = query.where("amount", ">", String(amount_greater_than));
    }
    if (amount_less_than !== undefined) {
      query = query.where("amount", "<", String(amount_less_than));
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query
      .select([
        "id",
        "order_id",
        "customer_id",
        "provider_id",
        "amount",
        "currency_code",
        "last_status",
        "last_transaction_id",
        "success_transaction_id",
        "metadata",
        "created_at",
        "updated_at",
        "deleted_at",
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(data, total, input);
  }
}
