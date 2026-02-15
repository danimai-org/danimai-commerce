import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type RetrieveProductTagProcessInput, RetrieveProductTagSchema } from "./retrieve-product-tag.schema";
import type { Database, ProductTag } from "../../../db/type";

export const RETRIEVE_PRODUCT_TAG_PROCESS = Symbol("RetrieveProductTag");

@Process(RETRIEVE_PRODUCT_TAG_PROCESS)
export class RetrieveProductTagProcess
  implements ProcessContract<ProductTag | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductTagSchema,
  }) context: ProcessContextType<typeof RetrieveProductTagSchema>) {
    const { input } = context;

    const tag = await this.db
      .selectFrom("product_tags")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!tag) {
      throw new ValidationError("Product tag not found", [{
        type: "not_found",
        message: "Product tag not found",
        path: "id",
      }]);
    }

    return tag;
  }
}
