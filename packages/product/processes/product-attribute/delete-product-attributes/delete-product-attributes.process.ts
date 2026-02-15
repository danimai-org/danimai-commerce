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
import { type DeleteProductAttributesProcessInput, DeleteProductAttributesSchema } from "./delete-product-attributes.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_ATTRIBUTES_PROCESS = Symbol("DeleteProductAttributes");

@Process(DELETE_PRODUCT_ATTRIBUTES_PROCESS)
export class DeleteProductAttributesProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductAttributesSchema,
  }) context: ProcessContextType<typeof DeleteProductAttributesSchema>): Promise<void> {
    const { input } = context;

    await this.validateAttributes(input);
    await this.deleteAttributes(input);
  }

  async validateAttributes(input: DeleteProductAttributesProcessInput) {
    const attributes = await this.db
      .selectFrom("product_attributes")
      .where("id", "in", input.attribute_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (attributes.length !== input.attribute_ids.length) {
      const foundIds = attributes.map((a) => a.id);
      const missingIds = input.attribute_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Product attributes not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product attributes not found: ${missingIds.join(", ")}`,
          path: "attribute_ids",
        }]
      );
    }

    return attributes;
  }

  async deleteAttributes(input: DeleteProductAttributesProcessInput) {
    this.logger.info("Deleting product attributes", {
      attribute_ids: input.attribute_ids,
    });

    await this.db
      .updateTable("product_attributes")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.attribute_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
