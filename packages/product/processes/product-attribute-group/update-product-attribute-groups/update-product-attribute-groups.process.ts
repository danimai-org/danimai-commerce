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
import { type UpdateProductAttributeGroupProcessInput, UpdateProductAttributeGroupSchema } from "./update-product-attribute-groups.schema";
import type { Database, ProductAttributeGroup } from "../../../db/type";

export const UPDATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS = Symbol("UpdateProductAttributeGroups");

@Process(UPDATE_PRODUCT_ATTRIBUTE_GROUPS_PROCESS)
export class UpdateProductAttributeGroupsProcess
  implements ProcessContract<ProductAttributeGroup | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateProductAttributeGroupSchema,
  }) context: ProcessContextType<typeof UpdateProductAttributeGroupSchema>) {
    const { input } = context;

    await this.validateGroup(input);

    const updated = await this.updateProductAttributeGroup(input);
    if (input.attribute_ids !== undefined && updated) {
      await this.syncGroupAttributes(updated.id, input.attribute_ids);
    }
    return updated;
  }

  async validateGroup(input: UpdateProductAttributeGroupProcessInput) {
    const group = await this.db
      .selectFrom("product_attribute_groups")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!group) {
      throw new ValidationError("Product attribute group not found", [{
        type: "not_found",
        message: "Product attribute group not found",
        path: "id",
      }]);
    }

    if (input.attribute_ids !== undefined && input.attribute_ids.length > 0) {
      const existing = await this.db
        .selectFrom("product_attributes")
        .where("id", "in", input.attribute_ids)
        .where("deleted_at", "is", null)
        .select("id")
        .execute();
      const foundIds = new Set(existing.map((r) => r.id));
      const missing = input.attribute_ids.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        throw new ValidationError(`Product attributes not found: ${missing.join(", ")}`, [{
          type: "not_found",
          message: `Product attributes not found: ${missing.join(", ")}`,
          path: "attribute_ids",
        }]);
      }
    }

    return group;
  }

  async updateProductAttributeGroup(input: UpdateProductAttributeGroupProcessInput) {
    this.logger.info("Updating product attribute group", { input });

    const updateData: { title?: string; metadata?: unknown } = {};
    if (input.title !== undefined) updateData.title = input.title;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    if (Object.keys(updateData).length === 0 && input.attribute_ids === undefined) {
      return this.db
        .selectFrom("product_attribute_groups")
        .where("id", "=", input.id)
        .where("deleted_at", "is", null)
        .selectAll()
        .executeTakeFirst();
    }

    if (Object.keys(updateData).length > 0) {
      await this.db
        .updateTable("product_attribute_groups")
        .set(updateData)
        .where("id", "=", input.id)
        .where("deleted_at", "is", null)
        .execute();
    }

    return this.db
      .selectFrom("product_attribute_groups")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
  }

  async syncGroupAttributes(attributeGroupId: string, attributeIds: string[]) {
    await this.db
      .deleteFrom("product_attribute_group_attributes")
      .where("attribute_group_id", "=", attributeGroupId)
      .execute();

    if (attributeIds.length === 0) return;

    await this.db
      .insertInto("product_attribute_group_attributes")
      .values(attributeIds.map((attribute_id) => ({ attribute_group_id: attributeGroupId, attribute_id })))
      .execute();
  }
}
