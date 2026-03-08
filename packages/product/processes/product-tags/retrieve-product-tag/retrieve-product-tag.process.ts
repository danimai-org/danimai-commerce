import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { type RetrieveProductTagProcessOutput, RetrieveProductTagSchema } from "./retrieve-product-tag.schema";
import type { Database } from "../../../db/type";

export const RETRIEVE_PRODUCT_TAG_PROCESS = Symbol("RetrieveProductTag");

@Process(RETRIEVE_PRODUCT_TAG_PROCESS)
export class RetrieveProductTagProcess
  implements ProcessContract<typeof RetrieveProductTagSchema, RetrieveProductTagProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductTagSchema,
  }) context: ProcessContextType<typeof RetrieveProductTagSchema>) {
    const { input } = context;

    const tag = await this.db
      .selectFrom("product_tags")
      .where("product_tags.id", "=", input.id)
      .where("product_tags.deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!tag) {
      throw new NotFoundError("Product tag not found");
    }

    return tag;
  }
}
