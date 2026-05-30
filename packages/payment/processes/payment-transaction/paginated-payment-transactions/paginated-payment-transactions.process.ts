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
  type PaginatedPaymentTransactionsProcessOutput,
  PaginatedPaymentTransactionsSchema,
} from "./paginated-payment-transactions.schema";
import type { Database } from "../../../db/type";

/**
 * Lists payment transactions with pagination and optional filters.
 * Input: pagination params and optional filters (payment_id, provider_id, customer_id, last_status, amount range).
 * Output: paginated payment transaction rows and metadata.
 */
export const PAGINATED_PAYMENT_TRANSACTIONS_PROCESS = Symbol(
  "PaginatedPaymentTransactions"
);

@Process(PAGINATED_PAYMENT_TRANSACTIONS_PROCESS)
export class PaginatedPaymentTransactionsProcess
  implements
    ProcessContract<
      typeof PaginatedPaymentTransactionsSchema,
      PaginatedPaymentTransactionsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedPaymentTransactionsSchema })
    context: ProcessContextType<typeof PaginatedPaymentTransactionsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "payment_transactions.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;
    const {
      payment_id,
      provider_id,
      customer_id,
      last_status,
      amount_greater_than,
      amount_less_than,
    } = input.filters ?? {};

    let query = this.db
      .selectFrom("payment_transactions")
      .where("deleted_at", "is", null);

    if (payment_id !== undefined) {
      query = query.where("payment_id", "=", payment_id);
    }
    if (provider_id !== undefined) {
      query = query.where("provider_id", "=", provider_id);
    }
    if (customer_id !== undefined) {
      query = query.where("customer_id", "=", customer_id);
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
        "payment_id",
        "provider_id",
        "amount",
        "currency_code",
        "last_status",
        "metadata",
        "payment_intent_id",
        "checkout_id",
        "customer_id",
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
