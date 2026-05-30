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
  type PaginatedRefundsProcessOutput,
  PaginatedRefundsSchema,
} from "./paginated-refunds.schema";
import type { Database } from "../../../db/type";

/**
 * Lists refunds with pagination and optional filters.
 * Input: pagination params and optional filters (payment_id, customer_id, payment_transaction_id, refund_reason_id, last_status, amount range, created_by).
 * Output: paginated refund rows and metadata.
 */
export const PAGINATED_REFUNDS_PROCESS = Symbol("PaginatedRefunds");

@Process(PAGINATED_REFUNDS_PROCESS)
export class PaginatedRefundsProcess
  implements
    ProcessContract<
      typeof PaginatedRefundsSchema,
      PaginatedRefundsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedRefundsSchema })
    context: ProcessContextType<typeof PaginatedRefundsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "refunds.created_at",
      sorting_direction = SortOrder.DESC,
    } = input;
    const {
      payment_id,
      customer_id,
      payment_transaction_id,
      refund_reason_id,
      last_status,
      amount_greater_than,
      amount_less_than,
      created_by,
    } = input.filters ?? {};

    let query = this.db.selectFrom("refunds").where("deleted_at", "is", null);

    if (payment_id !== undefined) {
      query = query.where("payment_id", "=", payment_id);
    }
    if (customer_id !== undefined) {
      query = query.where("customer_id", "=", customer_id);
    }
    if (payment_transaction_id !== undefined) {
      query = query.where("payment_transaction_id", "=", payment_transaction_id);
    }
    if (refund_reason_id !== undefined) {
      query = query.where("refund_reason_id", "=", refund_reason_id);
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
    if (created_by !== undefined) {
      query = query.where("created_by", "=", created_by);
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
        "customer_id",
        "payment_id",
        "payment_transaction_id",
        "amount",
        "refund_reason_id",
        "last_status",
        "stripe_refund_id",
        "created_by",
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
