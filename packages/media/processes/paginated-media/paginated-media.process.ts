import {
  InjectDB,
  Process,
  ProcessContext,
  paginationResponse,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { PaginatedMediaSchema, type PaginatedMediaProcessOutput } from "./paginated-media.schema";
import type { Database } from "../../db";

export const PAGINATED_MEDIA_PROCESS = Symbol("PaginatedMedia");

@Process(PAGINATED_MEDIA_PROCESS)
export class PaginatedMediaProcess
  implements ProcessContract<typeof PaginatedMediaSchema, PaginatedMediaProcessOutput> {
  constructor(@InjectDB() private readonly db: Kysely<Database>) {}

  /**
   * Lists media records with pagination and optional filters.
   * Input: pagination + filter values.
   * Output: paginated media rows.
   */
  async runOperations(
    @ProcessContext({ schema: PaginatedMediaSchema })
    context: ProcessContextType<typeof PaginatedMediaSchema>
  ) {
    const { input } = context;
    const page = Number(input.page ?? 1);
    const limit = Number(input.limit ?? 10);
    const offset = (page - 1) * limit;
    const filters = input.filters;

    let baseQuery = this.db
      .selectFrom("media_files")
      .where("deleted_at", "is", null);

    if (filters?.type) baseQuery = baseQuery.where("type", "=", filters.type);
    if (filters?.owner_type) baseQuery = baseQuery.where("owner_type", "=", filters.owner_type);
    if (filters?.owner_id) baseQuery = baseQuery.where("owner_id", "=", filters.owner_id);
    if (filters?.mime_type) baseQuery = baseQuery.where("mime_type", "=", filters.mime_type);

    if (input.search?.trim()) {
      const search = `%${input.search.trim()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("filename", "ilike", search),
          eb("original_filename", "ilike", search),
          eb("object_key", "ilike", search),
        ])
      );
    }

    const totalRow = await baseQuery
      .select(({ fn }) => [fn.countAll().as("count")])
      .executeTakeFirstOrThrow();
    const total = Number(totalRow.count);
    const sortingField = input.sorting_field ?? "media_files.created_at";
    const sortingDirection = input.sorting_direction ?? "desc";

    const rows = await baseQuery
      .selectAll()
      .orderBy(sortingField as any, sortingDirection)
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(rows, total, input);
  }
}
