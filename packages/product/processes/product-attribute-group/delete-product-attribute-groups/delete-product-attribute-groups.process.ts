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
import { type DeleteProductAttributeGroupsProcessInput, DeleteProductAttributeGroupsSchema } from "./delete-product-attribute-groups.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS = Symbol("DeleteProductAttributeGroups");

@Process(DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS)
export class DeleteProductAttributeGroupsProcess implements ProcessContract<typeof DeleteProductAttributeGroupsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductAttributeGroupsSchema,
  }) context: ProcessContextType<typeof DeleteProductAttributeGroupsSchema>) {
    const { input } = context;

    await this.validateGroups(input);
    await this.deleteGroups(input);
  }

  async validateGroups(input: DeleteProductAttributeGroupsProcessInput) {
    const uniqueIds = new Set(input.attribute_group_ids);
    if (uniqueIds.size !== input.attribute_group_ids.length) {
      throw new ValidationError("Attribute group IDs must be unique", [{
        type: "not_unique",
        message: "Attribute group IDs must be unique",
        path: "attribute_group_ids",
      }]);
    }
    
    const groups = await this.db
      .selectFrom("product_attribute_groups")
      .where("product_attribute_groups.id", "in", input.attribute_group_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (groups.length !== input.attribute_group_ids.length) {
      const foundIds = groups.map((g) => g.id);
      const missingIds = input.attribute_group_ids.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Product attribute groups not found: ${missingIds.join(", ")}`);
    }
  }

  async deleteGroups(input: DeleteProductAttributeGroupsProcessInput) {
    this.logger.info("Deleting product attribute groups", {
      attribute_group_ids: input.attribute_group_ids,
    });

    await this.db.transaction().execute(async (trx) => {
      await trx
      .deleteFrom("product_attribute_groups")
      .where("id", "in", input.attribute_group_ids)
      .execute();
      
      await trx
        .deleteFrom("product_attribute_group_relations")
        .where("attribute_group_id", "in", input.attribute_group_ids)
        .execute();
    });
  }
}
