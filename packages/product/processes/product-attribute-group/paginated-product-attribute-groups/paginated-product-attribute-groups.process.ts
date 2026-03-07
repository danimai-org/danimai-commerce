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
  type PaginatedProductAttributeGroupsProcessOutput,
  PaginatedProductAttributeGroupsSchema,
} from "./paginated-product-attribute-groups.schema";
import type { Database } from "../../../db/type";

export const PAGINATED_PRODUCT_ATTRIBUTE_GROUPS_PROCESS = Symbol("PaginatedProductAttributeGroups");

@Process(PAGINATED_PRODUCT_ATTRIBUTE_GROUPS_PROCESS)
export class PaginatedProductAttributeGroupsProcess
  implements ProcessContract<
    typeof PaginatedProductAttributeGroupsSchema,
    PaginatedProductAttributeGroupsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: PaginatedProductAttributeGroupsSchema,
  }) context: ProcessContextType<typeof PaginatedProductAttributeGroupsSchema>) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;

    let query = this.db
      .selectFrom("product_attribute_groups")
      .where("deleted_at", "is", null);
    
    if(search && search.trim()) {
      query = query.where("title", "ilike", `%${search.trim()}%`);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(`${sorting_field}`), sorting_direction);

    const attributeGroups = await query
      .selectAll()
      .limit(limit)
      .offset((page - 1) * limit)
      .execute();

    return paginationResponse(attributeGroups, total, input);
  }
}
