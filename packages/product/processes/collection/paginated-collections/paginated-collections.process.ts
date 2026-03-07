import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { paginationResponse } from "@danimai/core/pagination";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type PaginatedCollectionsProcessOutput,
  PaginatedCollectionsSchema,
} from "./paginated-collections.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_COLLECTIONS_PROCESS = Symbol("PaginatedCollections");

@Process(PAGINATED_COLLECTIONS_PROCESS)
export class PaginatedCollectionsProcess
  implements ProcessContract<
    typeof PaginatedCollectionsSchema,
    PaginatedCollectionsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedCollectionsSchema,
  }) context: ProcessContextType<typeof PaginatedCollectionsSchema>) {
    const { input } = context;
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC, search } = input;

    let baseQuery = this.db
      .selectFrom("product_collections")
      .where("product_collections.deleted_at", "is", null);

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      baseQuery = baseQuery.where((eb) =>
        eb.or([
          eb("product_collections.title", "ilike", searchTerm),
          eb("product_collections.handle", "ilike", searchTerm),
        ])
      );
    }

    const countResult = await baseQuery
      .select(({ fn }) => fn.count<number>("product_collections.id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    const collections = await baseQuery
      .leftJoin(
        "product_collection_relations",
        "product_collection_relations.product_collection_id",
        "product_collections.id"
      )
      .select([
        "product_collections.id",
        "product_collections.title",
        "product_collections.handle",
        "product_collections.metadata",
        "product_collections.created_at",
        "product_collections.updated_at",
        "product_collections.deleted_at",
        (eb) => sql<number>`
        (
          select count(product_collection_relations.product_id)
          from product_collection_relations
          where product_collection_relations.product_collection_id = product_collections.id
        )::int`.as("product_count"),
      ])
      .groupBy("product_collections.id")
      .orderBy(sql.ref(`${sorting_field}`), sorting_direction)
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return paginationResponse(collections, total, input);
  }
}
