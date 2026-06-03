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

    // Join payments/orders/customers so list rows show order # and customer email, not UUIDs.
    let query = this.db
      .selectFrom("payment_transactions")
      .leftJoin("payments", (join) =>
        join
          .onRef("payments.id", "=", "payment_transactions.payment_id")
          .on("payments.deleted_at", "is", null),
      )
      .leftJoin("orders", (join) =>
        join
          .onRef("orders.id", "=", "payments.order_id")
          .on("orders.deleted_at", "is", null),
      )
      .leftJoin("customers", (join) =>
        join
          .onRef("customers.id", "=", "payment_transactions.customer_id")
          .on("customers.deleted_at", "is", null),
      )
      .where("payment_transactions.deleted_at", "is", null);

    if (payment_id !== undefined) {
      query = query.where("payment_transactions.payment_id", "=", payment_id);
    }
    if (provider_id !== undefined) {
      query = query.where("payment_transactions.provider_id", "=", provider_id);
    }
    if (customer_id !== undefined) {
      query = query.where("payment_transactions.customer_id", "=", customer_id);
    }
    if (last_status !== undefined) {
      query = query.where("payment_transactions.last_status", "=", last_status);
    }
    if (amount_greater_than !== undefined) {
      query = query.where(
        "payment_transactions.amount",
        ">",
        String(amount_greater_than),
      );
    }
    if (amount_less_than !== undefined) {
      query = query.where(
        "payment_transactions.amount",
        "<",
        String(amount_less_than),
      );
    }

    const countResult = await query
      .select(({ fn }) =>
        fn.count<number>("payment_transactions.id").as("count"),
      )
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query
      .select([
        "payment_transactions.id",
        "payment_transactions.payment_id",
        "payment_transactions.provider_id",
        "payment_transactions.amount",
        "payment_transactions.currency_code",
        "payment_transactions.last_status",
        "payment_transactions.metadata",
        "payment_transactions.payment_intent_id",
        "payment_transactions.checkout_id",
        "payment_transactions.customer_id",
        "payment_transactions.created_at",
        "payment_transactions.updated_at",
        "payment_transactions.deleted_at",
        "payments.order_id as order_id",
        "orders.display_id as order_display_id",
        "customers.email as customer_email",
        "customers.first_name as customer_first_name",
        "customers.last_name as customer_last_name",
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(data, total, input);
  }
}
