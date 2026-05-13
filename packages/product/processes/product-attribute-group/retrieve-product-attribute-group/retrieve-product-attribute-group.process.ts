import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import {
  type RetrieveProductAttributeGroupProcessOutput,
  RetrieveProductAttributeGroupSchema,
} from "./retrieve-product-attribute-group.schema";
import type { Database } from "../../../db/type";

/**
 * Helper: normalizeAttributesColumn.
 * Input: function parameters for query/shape logic.
 * Output: derived data used by the process flow.
 */
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
 * Handles the retrieve product attribute group process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS = Symbol("RetrieveProductAttributeGroup");

@Process(RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS)
export class RetrieveProductAttributeGroupProcess
  implements ProcessContract<typeof RetrieveProductAttributeGroupSchema, RetrieveProductAttributeGroupProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: RetrieveProductAttributeGroupSchema,
  }) context: ProcessContextType<typeof RetrieveProductAttributeGroupSchema>) {
    const { input } = context;

    const group = await this.db
      .selectFrom("product_attribute_groups")
      .where("product_attribute_groups.id", "=", input.id)
      .where("product_attribute_groups.deleted_at", "is", null)
      .select([
        "product_attribute_groups.id",
        "product_attribute_groups.title",
        "product_attribute_groups.metadata",
        "product_attribute_groups.created_at",
        "product_attribute_groups.updated_at",
        "product_attribute_groups.deleted_at",
        () => sql`
          COALESCE(
            (
              SELECT json_agg(
                json_build_object(
                  'id', pa.id,
                  'title', pa.title,
                  'type', pa.type,
                  'required', COALESCE(pagr.required, false)
                )
                ORDER BY pa.title
              )
              FROM product_attribute_group_relations pagr
              INNER JOIN product_attributes pa
                ON pa.id = pagr.product_attribute_id
                AND pa.deleted_at IS NULL
              WHERE pagr.attribute_group_id = product_attribute_groups.id
            ),
            '[]'::json
          )
        `.as("attributes"),
      ])
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError("Product attribute group not found");
    }

    const row = group as Record<string, unknown>;
    return {
      ...group,
      attributes: normalizeAttributesColumn(row.attributes),
    } as RetrieveProductAttributeGroupProcessOutput;
  }
}
