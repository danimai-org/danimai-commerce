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
  RetrieveProductVariantSchema,
  type RetrieveProductVariantProcessOutput,
} from "./retrieve-product-variant.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the retrieve product variant process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_PRODUCT_VARIANT_PROCESS = Symbol(
  "RetrieveProductVariant",
);

@Process(RETRIEVE_PRODUCT_VARIANT_PROCESS)
export class RetrieveProductVariantProcess implements ProcessContract<
  typeof RetrieveProductVariantSchema,
  RetrieveProductVariantProcessOutput
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: variant row plus aggregated `options` (option title/value/rank
   * resolved through option_values + options) and `price_sets` (each with
   * its nested `prices`). A flat `prices` field is also returned for
   * backward compatibility with existing consumers.
   */
  async runOperations(
    @ProcessContext({
      schema: RetrieveProductVariantSchema,
    })
    context: ProcessContextType<typeof RetrieveProductVariantSchema>,
  ) {
    const { input } = context;

    // Single query: LEFT JOINs resolve the variant -> option_value -> option
    // chain so options can be aggregated alongside the variant. price_sets
    // (with nested prices) is built via a correlated jsonb subquery to avoid
    // a cartesian product with the option joins.
    const variant = await this.db
      .selectFrom("product_variants")
      .leftJoin(
        "product_variant_option_relations",
        "product_variant_option_relations.variant_id",
        "product_variants.id",
      )
      .leftJoin("product_option_values", (join) =>
        join
          .onRef(
            "product_option_values.id",
            "=",
            "product_variant_option_relations.option_value_id",
          )
          .on("product_option_values.deleted_at", "is", null),
      )
      .leftJoin("product_options", (join) =>
        join
          .onRef("product_options.id", "=", "product_option_values.option_id")
          .on("product_options.deleted_at", "is", null),
      )
      .where("product_variants.id", "=", input.id)
      .where("product_variants.deleted_at", "is", null)
      .selectAll("product_variants")
      .select(
        sql<
          Array<{
            id: string;
            title: string;
            value: string;
            rank: number;
          }>
        >`COALESCE(
          jsonb_agg(
            DISTINCT jsonb_build_object(
              'id', product_option_values.id,
              'title', product_options.title,
              'value', product_option_values.value,
              'rank', product_option_values.rank
            )
          ) FILTER (WHERE product_option_values.id IS NOT NULL),
          '[]'::jsonb
        )`.as("options"),
      )
      .select(
        sql<
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
        >`COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'id', ps.id,
                'prices', COALESCE(
                  (
                    SELECT jsonb_agg(
                      jsonb_build_object(
                        'id', p.id,
                        'amount', p.amount,
                        'currency_code', p.currency_code,
                        'min_quantity', p.min_quantity,
                        'max_quantity', p.max_quantity
                      )
                      ORDER BY p.id
                    )
                    FROM prices p
                    WHERE p.price_set_id = ps.id
                      AND p.deleted_at IS NULL
                  ),
                  '[]'::jsonb
                )
              )
            )
            FROM price_sets ps
            WHERE ps.variant_id = product_variants.id
              AND ps.deleted_at IS NULL
          ),
          '[]'::jsonb
        )`.as("price_sets"),
      )
      .groupBy("product_variants.id")
      .executeTakeFirst();

    if (!variant) {
      throw new NotFoundError("Product variant not found");
    }

    return {
      ...variant,
      prices: variant.price_sets.flatMap((ps) =>
        ps.prices.map((p) => ({
          amount: p.amount,
          currency_code: p.currency_code,
        })),
      ),
    };
  }
}
