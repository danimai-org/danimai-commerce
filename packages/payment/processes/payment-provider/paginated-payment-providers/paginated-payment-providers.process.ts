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
  type PaginatedPaymentProvidersProcessOutput,
  PaginatedPaymentProvidersSchema,
} from "./paginated-payment-providers.schema";
import type { Database } from "../../../db/type";

/**
 * Lists payment providers with pagination, search, and active filter.
 * Input: pagination params, optional search, optional filters.active.
 * Output: paginated payment provider rows and metadata.
 */
export const PAGINATED_PAYMENT_PROVIDERS_PROCESS = Symbol(
  "PaginatedPaymentProviders"
);

@Process(PAGINATED_PAYMENT_PROVIDERS_PROCESS)
export class PaginatedPaymentProvidersProcess
  implements ProcessContract<
    typeof PaginatedPaymentProvidersSchema,
    PaginatedPaymentProvidersProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedPaymentProvidersSchema })
    context: ProcessContextType<typeof PaginatedPaymentProvidersSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "payment_providers.created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;
    const { active } = input.filters ?? {};

    let query = this.db
      .selectFrom("payment_providers")
      .where("deleted_at", "is", null);

    if (active !== undefined) {
      query = query.where("active", "=", active);
    }

    if (search && search.trim()) {
      query = query.where("name", "ilike", `%${search.trim()}%`);
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
        "name",
        "metadata",
        "active",
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
