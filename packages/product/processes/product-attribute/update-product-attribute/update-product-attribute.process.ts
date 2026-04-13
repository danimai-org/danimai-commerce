import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type UpdateProductAttributeProcessOutput, UpdateProductAttributeSchema } from "./update-product-attribute.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the update product attribute process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_PRODUCT_ATTRIBUTE_PROCESS = Symbol("UpdateProductAttribute");

@Process(UPDATE_PRODUCT_ATTRIBUTE_PROCESS)
export class UpdateProductAttributeProcess
  implements ProcessContract<typeof UpdateProductAttributeSchema, UpdateProductAttributeProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: UpdateProductAttributeSchema,
  }) context: ProcessContextType<typeof UpdateProductAttributeSchema>) {
    const { input } = context;
    const attribute = await this.db
      .selectFrom("product_attributes")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!attribute) {
      throw new NotFoundError("Product attribute not found");
    }

    if (input.title !== undefined) {
      const existingAttribute = await this.db
        .selectFrom("product_attributes")
        .where("title", "ilike", input.title)
        .where("deleted_at", "is", null)
        .where("id", "!=", input.id)
        .selectAll()
        .executeTakeFirst();

      if (existingAttribute) {
        throw new ValidationError("Product attribute already exists", [{
          type: "already_exists",
          message: "Product attribute already exists",
          path: "title",
        }]);
      }
    }


    return this.db
      .updateTable("product_attributes")
      .set({ ...input, updated_at: new Date() })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }

}
