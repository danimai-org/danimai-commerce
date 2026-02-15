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
import { type RetrieveProductOptionProcessInput, RetrieveProductOptionSchema } from "./retrieve-product-option.schema";
import type { Database, ProductOption } from "../../../db/type";

export const RETRIEVE_PRODUCT_OPTION_PROCESS = Symbol("RetrieveProductOption");

@Process(RETRIEVE_PRODUCT_OPTION_PROCESS)
export class RetrieveProductOptionProcess
  implements ProcessContract<ProductOption | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductOptionSchema,
  }) context: ProcessContextType<typeof RetrieveProductOptionSchema>) {
    const { input } = context;

    const option = await this.db
      .selectFrom("product_options")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!option) {
      throw new ValidationError("Product option not found", [{
        type: "not_found",
        message: "Product option not found",
        path: "id",
      }]);
    }

    return option;
  }
}
