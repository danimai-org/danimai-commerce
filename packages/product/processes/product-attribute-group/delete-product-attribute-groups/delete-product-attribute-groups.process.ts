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
import { type DeleteProductAttributeGroupsProcessInput, DeleteProductAttributeGroupsSchema } from "./delete-product-attribute-groups.schema";
import type { Database } from "../../../db/type";

export const DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS = Symbol("DeleteProductAttributeGroups");

@Process(DELETE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS)
export class DeleteProductAttributeGroupsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteProductAttributeGroupsSchema,
  }) context: ProcessContextType<typeof DeleteProductAttributeGroupsSchema>): Promise<void> {
    const { input } = context;

    await this.validateGroups(input);
    await this.deleteGroups(input);
  }

  async validateGroups(input: DeleteProductAttributeGroupsProcessInput) {
    const groups = await this.db
      .selectFrom("product_attribute_groups")
      .where("id", "in", input.attribute_group_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (groups.length !== input.attribute_group_ids.length) {
      const foundIds = groups.map((g) => g.id);
      const missingIds = input.attribute_group_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Product attribute groups not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Product attribute groups not found: ${missingIds.join(", ")}`,
          path: "attribute_group_ids",
        }]
      );
    }
  }

  async deleteGroups(input: DeleteProductAttributeGroupsProcessInput) {
    this.logger.info("Deleting product attribute groups", {
      attribute_group_ids: input.attribute_group_ids,
    });

    await this.db
      .updateTable("product_attribute_groups")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.attribute_group_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
