import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  SortOrder,
} from "@danimai/core";
import { paginationResponse } from "@danimai/core/pagination";
import { Kysely, sql } from "kysely";
import {
  type PaginatedProductAttributesProcessOutput,
  PaginatedProductAttributesSchema,
} from "./paginated-product-attributes.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the paginated product attributes process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const PAGINATED_PRODUCT_ATTRIBUTES_PROCESS = Symbol("PaginatedProductAttributes");

@Process(PAGINATED_PRODUCT_ATTRIBUTES_PROCESS)
export class PaginatedProductAttributesProcess
  implements ProcessContract<
    typeof PaginatedProductAttributesSchema,
    PaginatedProductAttributesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: PaginatedProductAttributesSchema,
  }) context: ProcessContextType<typeof PaginatedProductAttributesSchema>) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;
    const { category_id } = input.filters ?? {};
    let query = this.db
      .selectFrom("product_attributes")
      .where("product_attributes.deleted_at", "is", null);

    if (category_id) {
      query = query.innerJoin(
        "product_category_attribute_relations",
        (join) =>
          join
            .onRef(
              "product_category_attribute_relations.product_attribute_id",
              "=",
              "product_attributes.id",
            )
            .on(
              "product_category_attribute_relations.category_id",
              "=",
              category_id,
            ),
      );
    }

    if (search && search.trim()) {
      query = query.where(
        "product_attributes.title",
        "ilike",
        `%${search.trim()}%`,
      );
    }

    const countResult = await query
      .select(({ fn }) =>
        fn.count<number>("product_attributes.id").as("count"),
      )
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(
      sql.ref(`product_attributes.${sorting_field}`),
      sorting_direction,
    );

    const attributes = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .selectAll("product_attributes")
      .execute();

    return paginationResponse(attributes, total, input);
  }
}
