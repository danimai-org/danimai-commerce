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
import { type DeleteProductAttributesProcessInput, DeleteProductAttributesSchema } from "./delete-product-attributes.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_ATTRIBUTES_PROCESS = Symbol("DeleteProductAttributes");

@Process(DELETE_PRODUCT_ATTRIBUTES_PROCESS)
export class DeleteProductAttributesProcess implements ProcessContract<typeof DeleteProductAttributesSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductAttributesSchema,
  }) context: ProcessContextType<typeof DeleteProductAttributesSchema>) {
    const { input } = context;

    await this.validateAttributes(input);
    await this.deleteAttributes(input);
  }

  async validateAttributes(input: DeleteProductAttributesProcessInput) {
    const uniqueIds = new Set(input.attribute_ids);
    if (uniqueIds.size !== input.attribute_ids.length) {
      throw new ValidationError("Attribute IDs must be unique", [{
        type: "not_unique",
        message: "Attribute IDs must be unique",
        path: "attribute_ids",
      }]);
    }
    const attributes = await this.db
      .selectFrom("product_attributes")
      .where("product_attributes.id", "in", input.attribute_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (attributes.length !== input.attribute_ids.length) {
      const foundIds = attributes.map((a) => a.id);
      const missingIds = input.attribute_ids.filter((id) => !foundIds.includes(id));
      
      throw new NotFoundError(`Product attributes not found: ${missingIds.join(", ")}`);
    }

    return attributes;
  }

  async deleteAttributes(input: DeleteProductAttributesProcessInput) {
    this.logger.info("Deleting product attributes", {
      attribute_ids: input.attribute_ids,
    });

    await this.db.transaction().execute(async (trx) => {
      await trx
        .deleteFrom("product_attribute_values")
        .where("attribute_id", "in", input.attribute_ids)
        .execute();
      
      await trx
        .deleteFrom("product_attribute_group_relations")
        .where("product_attribute_id", "in", input.attribute_ids)
        .execute();
      
      await trx
        .deleteFrom("product_attributes")
        .where("id", "in", input.attribute_ids)
        .where("deleted_at", "is", null)
        .execute();
    });
  }
}
