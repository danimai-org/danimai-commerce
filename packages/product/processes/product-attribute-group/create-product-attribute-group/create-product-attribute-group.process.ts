import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type CreateProductAttributeGroupProcessOutput, CreateProductAttributeGroupSchema } from "./create-product-attribute-group.schema";
import type { Database } from "../../../db/type";
import { randomUUID } from "crypto";

export const CREATE_PRODUCT_ATTRIBUTE_GROUP_PROCESS = Symbol("CreateProductAttributeGroup");

@Process(CREATE_PRODUCT_ATTRIBUTE_GROUP_PROCESS)
export class CreateProductAttributeGroupProcess
  implements ProcessContract<typeof CreateProductAttributeGroupSchema, CreateProductAttributeGroupProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateProductAttributeGroupSchema,
  }) context: ProcessContextType<typeof CreateProductAttributeGroupSchema>) {
    const { input } = context;

    const existingGroup = await this.db
      .selectFrom("product_attribute_groups")
      .where("title", "ilike", input.title)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (existingGroup) {
      return existingGroup;
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
      const group = await trx
        .insertInto("product_attribute_groups")
        .values({
          id: randomUUID(),
          title: input.title,
          metadata: input.metadata ?? null,
        })
        .returningAll()
        .executeTakeFirst();

      if (group) {
        const relations = (input.attributes ?? []).map((attribute, rank) => ({
          id: randomUUID(),
          attribute_group_id: group.id,
          product_attribute_id: attribute.attribute_id,
          required: attribute.required ?? false,
          rank,
        }));

        if (relations.length > 0) {
          await trx
            .insertInto("product_attribute_group_relations")
            .values(relations)
            .execute();
        }
      }

      return group;
    });

  }

}
