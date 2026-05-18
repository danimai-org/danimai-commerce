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
  type PaginatedProductVariantsProcessOutput,
  PaginatedProductVariantsSchema,
} from "./paginated-product-variants.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the paginated product variants process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const PAGINATED_PRODUCT_VARIANTS_PROCESS = Symbol(
  "PaginatedProductVariants",
);

@Process(PAGINATED_PRODUCT_VARIANTS_PROCESS)
export class PaginatedProductVariantsProcess implements ProcessContract<
  typeof PaginatedProductVariantsSchema,
  PaginatedProductVariantsProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedProductVariantsSchema,
    })
    context: ProcessContextType<typeof PaginatedProductVariantsSchema>,
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "created_at",
      sorting_direction = SortOrder.DESC,
      search,
    } = input;
    const { product_id } = input.filters ?? {};

    let query = this.db
      .selectFrom("product_variants")
      .where("deleted_at", "is", null);

    if (product_id) {
      query = query.where("product_id", "=", product_id);
    }

    if (search && search.trim()) {
      query = query.where("title", "ilike", `%${search.trim()}%`);
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count || 0);

    query = query.orderBy(sql.ref(`${sorting_field}`), sorting_direction);

    const variants = await query
      .limit(limit)
      .offset((page - 1) * limit)
      .selectAll()
      .execute();

    const variantIds = variants.map((v) => v.id);
    if (variantIds.length === 0) {
      return paginationResponse([], total, input);
    }

    // Options enrichment: join variant_option_relations -> option_values -> options
    // and group results by variant_id in code (matches paginated-products pattern).
    const optionRows = await this.db
      .selectFrom("product_variant_option_relations")
      .innerJoin(
        "product_option_values",
        (join) =>
          join
            .onRef(
              "product_option_values.id",
              "=",
              "product_variant_option_relations.option_value_id",
            )
            .on("product_option_values.deleted_at", "is", null),
      )
      .innerJoin(
        "product_options",
        (join) =>
          join
            .onRef(
              "product_options.id",
              "=",
              "product_option_values.option_id",
            )
            .on("product_options.deleted_at", "is", null),
      )
      .where(
        "product_variant_option_relations.variant_id",
        "in",
        variantIds,
      )
      .select([
        "product_variant_option_relations.variant_id as variant_id",
        "product_option_values.id as id",
        "product_options.title as title",
        "product_option_values.value as value",
        "product_option_values.rank as rank",
      ])
      .orderBy("product_variant_option_relations.variant_id", "asc")
      .orderBy("product_option_values.rank", "asc")
      .execute();

    const optionsByVariantId = new Map<
      string,
      Array<{ id: string; title: string; value: string; rank: number }>
    >();
    for (const row of optionRows) {
      const existing = optionsByVariantId.get(row.variant_id) ?? [];
      existing.push({
        id: row.id,
        title: row.title,
        value: row.value,
        rank: row.rank,
      });
      optionsByVariantId.set(row.variant_id, existing);
    }

    // Price sets enrichment: aggregate prices per price_set in SQL using jsonb_agg
    // (FILTER skips the null row produced by the LEFT JOIN when a price_set has
    // no prices), then group price_sets per variant in code.
    const priceSetRows = await (this.db as any)
      .selectFrom("price_sets")
      .leftJoin("prices", (join: any) =>
        join
          .onRef("prices.price_set_id", "=", "price_sets.id")
          .on("prices.deleted_at", "is", null),
      )
      .where("price_sets.variant_id", "in", variantIds)
      .where("price_sets.deleted_at", "is", null)
      .select([
        "price_sets.id as id",
        "price_sets.variant_id as variant_id",
      ])
      .select(
        sql<
          Array<{
            id: string;
            amount: string;
            currency_code: string;
            min_quantity: number | null;
            max_quantity: number | null;
          }>
        >`COALESCE(
          jsonb_agg(
            jsonb_build_object(
              'id', prices.id,
              'amount', prices.amount,
              'currency_code', prices.currency_code,
              'min_quantity', prices.min_quantity,
              'max_quantity', prices.max_quantity
            )
          ) FILTER (WHERE prices.id IS NOT NULL),
          '[]'::jsonb
        )`.as("prices"),
      )
      .groupBy(["price_sets.id", "price_sets.variant_id"])
      .execute();

    const priceSetsByVariantId = new Map<
      string,
      Array<{
        id: string;
        prices: Array<{
          id: string;
          amount: string;
          currency_code: string;
          min_quantity: number | null;
          max_quantity: number | null;
        }>;
      }>
    >();
    for (const row of priceSetRows as Array<{
      id: string;
      variant_id: string;
      prices: Array<{
        id: string;
        amount: string;
        currency_code: string;
        min_quantity: number | null;
        max_quantity: number | null;
      }>;
    }>) {
      const existing = priceSetsByVariantId.get(row.variant_id) ?? [];
      existing.push({ id: row.id, prices: row.prices });
      priceSetsByVariantId.set(row.variant_id, existing);
    }

    const enrichedVariants = variants.map((variant) => ({
      ...variant,
      options: optionsByVariantId.get(variant.id) ?? [],
      price_sets: priceSetsByVariantId.get(variant.id) ?? [],
    }));

    return paginationResponse(enrichedVariants, total, input);
  }
}
