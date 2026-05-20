import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import { type RetrieveProductCategoryProcessOutput, RetrieveProductCategorySchema } from "./retrieve-product-category.schema";
import type { Database } from "../../../db/type";

function normalizeAttributesColumn(
  raw: unknown
): Array<{ id: string; title: string; type: string; required: boolean }> {
  if (raw == null) return [];
  let parsed: unknown = raw;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  const out: Array<{ id: string; title: string; type: string; required: boolean }> = [];
  for (const item of parsed) {
    if (item == null) continue;
    if (typeof item === "string") {
      try {
        const o = JSON.parse(item) as Record<string, unknown>;
        if (
          typeof o.id === "string" &&
          typeof o.title === "string" &&
          typeof o.type === "string"
        ) {
          out.push({
            id: o.id,
            title: o.title,
            type: o.type,
            required: typeof o.required === "boolean" ? o.required : false,
          });
        }
      } catch {
        /* skip */
      }
      continue;
    }
    if (typeof item === "object") {
      const o = item as Record<string, unknown>;
      if (
        typeof o.id === "string" &&
        typeof o.title === "string" &&
        typeof o.type === "string"
      ) {
        out.push({
          id: o.id,
          title: o.title,
          type: o.type,
          required: typeof o.required === "boolean" ? o.required : false,
        });
      }
    }
  }
  return out;
}

/**
 * Handles the retrieve product category process.
 * Input: validated process context input for this operation.
 * Output: category row with linked attributes aggregated in one query.
 */
export const RETRIEVE_PRODUCT_CATEGORY_PROCESS = Symbol("RetrieveProductCategory");

@Process(RETRIEVE_PRODUCT_CATEGORY_PROCESS)
export class RetrieveProductCategoryProcess
  implements ProcessContract<typeof RetrieveProductCategorySchema, RetrieveProductCategoryProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: category with attributes array for detail views.
   */
  async runOperations(@ProcessContext({
    schema: RetrieveProductCategorySchema,
  }) context: ProcessContextType<typeof RetrieveProductCategorySchema>) {
    const { input } = context;

    const category = await this.db
      .selectFrom("product_categories")
      .where("product_categories.id", "=", input.id)
      .where("product_categories.deleted_at", "is", null)
      .select([
        "product_categories.id",
        "product_categories.value",
        "product_categories.handle",
        "product_categories.metadata",
        "product_categories.parent_id",
        "product_categories.status",
        "product_categories.visibility",
        "product_categories.created_at",
        "product_categories.updated_at",
        "product_categories.deleted_at",
        () => sql`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pa.id,
                  'title', pa.title,
                  'type', pa.type,
                  'required', COALESCE(pcar.required, false)
                )
                ORDER BY pcar.rank, pa.title
              )
              FROM product_category_attribute_relations pcar
              INNER JOIN product_attributes pa
                ON pa.id = pcar.product_attribute_id
                AND pa.deleted_at IS NULL
              WHERE pcar.category_id = product_categories.id
            ),
            '[]'::json
          )
        `.as("attributes"),
      ])
      .executeTakeFirst();

    if (!category) {
      throw new NotFoundError("Category not found");
    }

    const row = category as Record<string, unknown>;
    return {
      ...category,
      attributes: normalizeAttributesColumn(row.attributes),
    } as RetrieveProductCategoryProcessOutput;
  }
}
