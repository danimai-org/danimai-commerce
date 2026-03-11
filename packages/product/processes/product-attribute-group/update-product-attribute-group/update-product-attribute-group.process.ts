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
import { type UpdateProductAttributeGroupProcessInput, type UpdateProductAttributeGroupProcessOutput, UpdateProductAttributeGroupSchema } from "./update-product-attribute-group.schema";
import type { Database } from "../../../db/type";
import { randomUUID } from "crypto";

export const UPDATE_PRODUCT_ATTRIBUTE_GROUP_PROCESS = Symbol("UpdateProductAttributeGroup");

@Process(UPDATE_PRODUCT_ATTRIBUTE_GROUP_PROCESS)
export class UpdateProductAttributeGroupProcess
  implements ProcessContract<typeof UpdateProductAttributeGroupSchema, UpdateProductAttributeGroupProcessOutput> {
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
    const group = await this.db
      .selectFrom("product_attribute_groups")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError("Product attribute group not found");
    }


    if (input.title !== undefined) {
      const existingGroup = await this.db
        .selectFrom("product_attribute_groups")
        .where("title", "ilike", input.title)
        .where("deleted_at", "is", null)
        .where("id", "!=", input.id)
        .selectAll()
        .executeTakeFirst();

      if (existingGroup) {
        throw new ValidationError("Product attribute group already exists", [{
          type: "already_exists",
          message: "Product attribute group already exists",
          path: "title",
        }]);
      }
    }

    if (input.attributes && input.attributes.length > 0) {
      const attributes = await this.db
        .selectFrom("product_attributes")
        .where("id", "in", input.attributes.map((a) => a.attribute_id))
        .where("deleted_at", "is", null)
        .selectAll()
        .execute();

      if (attributes.length !== input.attributes.length) {
        const missingIds = input.attributes.filter((a) => !attributes.some((a2) => a2.id === a.attribute_id)).map((a) => a.attribute_id);

        throw new ValidationError(`Product attributes not found: ${missingIds.join(", ")}`, [{
          type: "not_found",
          message: `Product attributes not found: ${missingIds.join(", ")}`,
          path: "attributes",
        }]);
      }
    }


    return this.db.transaction().execute(async (trx) => {
      const updateDate = {
        ...input,
        updated_at: new Date(),
        attributes: undefined,
      }
      await trx.updateTable("product_attribute_groups")
        .set(updateDate)
        .where("id", "=", input.id)
        .where("deleted_at", "is", null)
        .execute();

      if (input.attributes && input.attributes.length > 0) {
        await trx.deleteFrom("product_attribute_group_relations")
          .where("attribute_group_id", "=", input.id)
          .execute();

        await trx
          .insertInto("product_attribute_group_relations")
          .values(input.attributes.map((a, rank) => ({
            id: randomUUID(),
            attribute_group_id: input.id,
            product_attribute_id: a.attribute_id,
            required: a.required ?? false,
            rank,
          })))
          .execute();
      }

      return group;
    });
  }

}
