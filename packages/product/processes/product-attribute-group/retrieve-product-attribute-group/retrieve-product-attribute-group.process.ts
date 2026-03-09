import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import {  type RetrieveProductAttributeGroupProcessOutput, RetrieveProductAttributeGroupSchema } from "./retrieve-product-attribute-group.schema";
import type { Database } from "../../../db/type";
import type { Static } from "@sinclair/typebox";


export const RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS = Symbol("RetrieveProductAttributeGroup");

@Process(RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS)
export class RetrieveProductAttributeGroupProcess
  implements ProcessContract<typeof RetrieveProductAttributeGroupSchema, RetrieveProductAttributeGroupProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductAttributeGroupSchema,
  }) context: ProcessContextType<typeof RetrieveProductAttributeGroupSchema>) {
    const { input } = context;

    const group = await this.db
      .selectFrom("product_attribute_groups")
      .where("product_attribute_groups.id", "=", input.id)
      .where("product_attribute_groups.deleted_at", "is", null)
      .leftJoin("product_attribute_group_attributes", (join) =>
        join
          .onRef("product_attribute_group_attributes.attribute_group_id", "=", "product_attribute_groups.id")
      ).leftJoin("product_attributes", (join) =>
        join
          .onRef("product_attributes.id", "=", "product_attribute_group_attributes.attribute_id")
          .on("product_attributes.deleted_at", "is", null)
      )
      .select([
        "product_attribute_groups.id",
        "product_attribute_groups.title",
        "product_attribute_groups.metadata",
        "product_attribute_groups.created_at",
        "product_attribute_groups.updated_at",
        "product_attribute_groups.deleted_at",
        () => sql<Static<typeof RetrieveProductAttributeGroupSchema["attributes"]>[]>`
          CASE
            WHEN count(product_attributes.id) = 0 THEN ARRAY[]::json[]
            ELSE array_agg(
              DISTINCT jsonb_build_object(
                'id', product_attributes.id,
                'title', product_attributes.title,
                'type', product_attributes.type
              )
            )::json[]
          END
        `.as('attributes'),
      ])
      .groupBy([
        "product_attribute_groups.id",
        "product_attribute_groups.title",
        "product_attribute_groups.metadata",
        "product_attribute_groups.created_at",
        "product_attribute_groups.updated_at",
        "product_attribute_groups.deleted_at",
      ])
      .executeTakeFirst();

    if (!group) {
      throw new NotFoundError("Product attribute group not found");
    }


    return group;
  }
}
