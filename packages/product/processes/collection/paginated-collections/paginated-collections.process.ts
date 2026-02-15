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
import { type PaginatedCollectionsProcessInput, PaginatedCollectionsSchema } from "./paginated-collections.schema";
import type { Database, ProductCollection } from "../../../db/type";

export const PAGINATED_COLLECTIONS_PROCESS = Symbol("PaginatedCollections");

// TODO: Implement filters later
@Process(PAGINATED_COLLECTIONS_PROCESS)
export class PaginatedCollectionsProcess
  implements ProcessContract<PaginationResponseType<ProductCollection>> {
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
    const { page = 1, limit = 10, sorting_field = "created_at", sorting_direction = SortOrder.DESC } = input;

    // Get total count before pagination
    const countResult = await this.db
      .selectFrom("product_collections")
      .where("deleted_at", "is", null)
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    // Apply sorting using sql template for dynamic column names
    const sortOrder = sorting_direction === SortOrder.ASC ? "asc" : "desc";
    // Validate sorting_field against allowed columns to prevent SQL injection
    const allowedSortFields = ["id", "title", "handle", "created_at", "updated_at", "deleted_at"];
    const safeSortField = allowedSortFields.includes(sorting_field) ? sorting_field : "created_at";

    // Apply pagination and include product count
    const offset = (page - 1) * limit;
    const dataWithCount = await this.db
      .selectFrom("product_collections")
      .where("product_collections.deleted_at", "is", null)
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
        sql<number>`count(product_collection_relations.product_id)::int`.as("product_count"),
      ])
      .groupBy("product_collections.id")
      .orderBy(sql.ref(`product_collections.${safeSortField}`), sortOrder)
      .limit(limit)
      .offset(offset)
      .execute();

    // Return paginated response
    return paginationResponse(dataWithCount, total, input);
  }
}
