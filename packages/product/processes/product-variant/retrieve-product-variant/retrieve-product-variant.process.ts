import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
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
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({
      schema: RetrieveProductVariantSchema,
    })
    context: ProcessContextType<typeof RetrieveProductVariantSchema>,
  ) {
    const { input } = context;

    const variant = await this.db
      .selectFrom("product_variants")
      .where("product_variants.id", "=", input.id)
      .where("product_variants.deleted_at", "is", null)
      .selectAll("product_variants")
      .executeTakeFirst();

    if (!variant) {
      throw new NotFoundError("Product variant not found");
    }

    const priceRows = await this.db
      .selectFrom("price_sets")
      .innerJoin("prices", (join) =>
        join
          .onRef("prices.price_set_id", "=", "price_sets.id")
          .on("prices.deleted_at", "is", null),
      )
      .where("price_sets.variant_id", "=", input.id)
      .where("price_sets.deleted_at", "is", null)
      .select(["prices.amount as amount", "prices.currency_code as currency_code"])
      .orderBy("prices.id", "asc")
      .execute();

    return {
      ...variant,
      prices: priceRows.map((r) => ({
        amount: r.amount,
        currency_code: r.currency_code,
      })),
    };
  }
}
