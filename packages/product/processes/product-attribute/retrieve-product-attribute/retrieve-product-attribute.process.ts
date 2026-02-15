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
import { type RetrieveProductAttributeProcessInput, RetrieveProductAttributeSchema } from "./retrieve-product-attribute.schema";
import type { Database, ProductAttribute } from "../../../db/type";

export const RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS = Symbol("RetrieveProductAttribute");

@Process(RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS)
export class RetrieveProductAttributeProcess
  implements ProcessContract<ProductAttribute | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductAttributeSchema,
  }) context: ProcessContextType<typeof RetrieveProductAttributeSchema>) {
    const { input } = context;

    const attribute = await this.db
      .selectFrom("product_attributes")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!attribute) {
      throw new ValidationError("Product attribute not found", [{
        type: "not_found",
        message: "Product attribute not found",
        path: "id",
      }]);
    }

    return attribute;
  }
}
