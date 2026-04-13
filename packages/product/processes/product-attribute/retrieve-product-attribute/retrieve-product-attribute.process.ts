import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import { type RetrieveProductAttributeProcessInput, type RetrieveProductAttributeProcessOutput, RetrieveProductAttributeSchema } from "./retrieve-product-attribute.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the retrieve product attribute process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS = Symbol("RetrieveProductAttribute");

@Process(RETRIEVE_PRODUCT_ATTRIBUTE_PROCESS)
export class RetrieveProductAttributeProcess
  implements ProcessContract<typeof RetrieveProductAttributeSchema, RetrieveProductAttributeProcessOutput> {
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
    schema: RetrieveProductAttributeSchema,
  }) context: ProcessContextType<typeof RetrieveProductAttributeSchema>) {
    const { input } = context;

    const attribute = await this.db
      .selectFrom("product_attributes")
      .where("product_attributes.id", "=", input.id)
      .where("product_attributes.deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!attribute) {
      throw new NotFoundError("Product attribute not found");
    }

    return attribute;
  }
}
