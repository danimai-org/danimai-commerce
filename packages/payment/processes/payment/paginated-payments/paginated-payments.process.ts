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

    // Join orders/customers once so list rows show display_id and email instead of raw UUIDs.
    let query = this.db
      .selectFrom("payments")
      .leftJoin("orders", (join) =>
        join
          .onRef("orders.id", "=", "payments.order_id")
          .on("orders.deleted_at", "is", null),
      )
      .leftJoin("customers", (join) =>
        join
          .onRef("customers.id", "=", "payments.customer_id")
          .on("customers.deleted_at", "is", null),
      )
      .leftJoin("payment_providers", (join) =>
        join
          .onRef("payment_providers.id", "=", "payments.provider_id")
          .on("payment_providers.deleted_at", "is", null),
      )
      .where("payments.deleted_at", "is", null);

    if (order_id !== undefined) {
      query = query.where("payments.order_id", "=", order_id);
    }
    if (provider_id !== undefined) {
      query = query.where("payments.provider_id", "=", provider_id);
    }
    if (customer_id !== undefined) {
      query = query.where("payments.customer_id", "=", customer_id);
    }
    if (currency_code !== undefined) {
      query = query.where("payments.currency_code", "=", currency_code);
    }
    if (last_status !== undefined) {
      query = query.where("payments.last_status", "=", last_status);
    }
    if (amount_greater_than !== undefined) {
      query = query.where("payments.amount", ">", String(amount_greater_than));
    }
    if (amount_less_than !== undefined) {
      query = query.where("payments.amount", "<", String(amount_less_than));
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("payments.id").as("count"))
      .executeTakeFirst();
    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const data = await query
      .select([
        "payments.id",
        "payments.order_id",
        "payments.customer_id",
        "payments.provider_id",
        "payments.amount",
        "payments.currency_code",
        "payments.last_status",
        "payments.last_transaction_id",
        "payments.success_transaction_id",
        "payments.metadata",
        "payments.created_at",
        "payments.updated_at",
        "payments.deleted_at",
        "orders.display_id as order_display_id",
        "customers.email as customer_email",
        "customers.first_name as customer_first_name",
        "customers.last_name as customer_last_name",
        "payment_providers.name as provider_name",
      ])
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(data, total, input);
  }
}
