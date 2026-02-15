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
import { type UpdateProductAttributeProcessInput, UpdateProductAttributeSchema } from "./update-product-attributes.schema";
import type { Database, ProductAttribute } from "../../../db/type";

export const UPDATE_PRODUCT_ATTRIBUTES_PROCESS = Symbol("UpdateProductAttributes");

@Process(UPDATE_PRODUCT_ATTRIBUTES_PROCESS)
export class UpdateProductAttributesProcess
  implements ProcessContract<ProductAttribute | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductAttributeSchema,
  }) context: ProcessContextType<typeof UpdateProductAttributeSchema>) {
    const { input } = context;

    await this.validateAttribute(input);

    return this.updateProductAttribute(input);
  }

  async validateAttribute(input: UpdateProductAttributeProcessInput) {
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

  async updateProductAttribute(input: UpdateProductAttributeProcessInput) {
    this.logger.info("Updating product attribute", { input });

    const updateData: {
      title?: string;
      type?: string;
      metadata?: unknown;
    } = {};

    if (input.title !== undefined) {
      updateData.title = input.title;
    }

    if (input.type !== undefined) {
      updateData.type = input.type;
    }

    if (input.metadata !== undefined) {
      updateData.metadata = input.metadata;
    }

    return this.db
      .updateTable("product_attributes")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
