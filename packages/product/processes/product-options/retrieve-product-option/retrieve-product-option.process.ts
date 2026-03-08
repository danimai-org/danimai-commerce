import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { type RetrieveProductOptionProcessOutput, RetrieveProductOptionSchema } from "./retrieve-product-option.schema";
import type { Database } from "../../../db/type";

export const RETRIEVE_PRODUCT_OPTION_PROCESS = Symbol("RetrieveProductOption");

@Process(RETRIEVE_PRODUCT_OPTION_PROCESS)
export class RetrieveProductOptionProcess
  implements ProcessContract<typeof RetrieveProductOptionSchema, RetrieveProductOptionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductOptionSchema,
  }) context: ProcessContextType<typeof RetrieveProductOptionSchema>) {
    const { input } = context;

    const option = await this.db
      .selectFrom("product_options")
      .where("product_options.id", "=", input.id)
      .where("product_options.deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!option) {
      throw new NotFoundError("Product option not found");
    }

    return option;
  }
}
