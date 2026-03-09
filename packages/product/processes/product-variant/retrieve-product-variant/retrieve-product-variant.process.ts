import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { RetrieveProductVariantSchema, type RetrieveProductVariantProcessOutput } from "./retrieve-product-variant.schema";
import type { Database } from "../../../db/type";

export const RETRIEVE_PRODUCT_VARIANT_PROCESS = Symbol("RetrieveProductVariant");

@Process(RETRIEVE_PRODUCT_VARIANT_PROCESS)
export class RetrieveProductVariantProcess
  implements ProcessContract<typeof RetrieveProductVariantSchema, RetrieveProductVariantProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) {}

  async runOperations(@ProcessContext({
    schema: RetrieveProductVariantSchema,
  }) context: ProcessContextType<typeof RetrieveProductVariantSchema>) {
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

    return variant;
  }
}
