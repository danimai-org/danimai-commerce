import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import {
  type PaginatedRefundReasonsProcessOutput,
  PaginatedRefundReasonsSchema,
} from "./paginated-refund-reasons.schema";
import type { Database } from "../../../db/type";

/**
 * Lists refund reasons with pagination and optional search.
 * Input: pagination params and optional search.
 * Output: paginated refund reason rows and metadata.
 */
export const PAGINATED_REFUND_REASONS_PROCESS = Symbol("PaginatedRefundReasons");

@Process(PAGINATED_REFUND_REASONS_PROCESS)
export class PaginatedRefundReasonsProcess
  implements
    ProcessContract<
      typeof PaginatedRefundReasonsSchema,
      PaginatedRefundReasonsProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) {}

  async runOperations(
    @ProcessContext({ schema: PaginatedRefundReasonsSchema })
    context: ProcessContextType<typeof PaginatedRefundReasonsSchema>
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "refund_reasons.created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;

    let query = this.db
      .selectFrom("refund_reasons")
      .where("deleted_at", "is", null);

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query = query.where((eb) =>
        eb.or([eb("label", "ilike", term), eb("value", "ilike", term)])
      );
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
        "label",
        "value",
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
