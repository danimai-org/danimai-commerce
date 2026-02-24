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
import { type RetrieveProductAttributeGroupProcessInput, RetrieveProductAttributeGroupSchema } from "./retrieve-product-attribute-group.schema";
import type { Database, ProductAttributeGroup } from "../../../db/type";

export type RetrieveProductAttributeGroupResult = ProductAttributeGroup & {
  attributes: Array<{ id: string; title: string; type: string }>;
};

export const RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS = Symbol("RetrieveProductAttributeGroup");

@Process(RETRIEVE_PRODUCT_ATTRIBUTE_GROUP_PROCESS)
export class RetrieveProductAttributeGroupProcess
  implements ProcessContract<RetrieveProductAttributeGroupResult | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductAttributeGroupSchema,
  }) context: ProcessContextType<typeof RetrieveProductAttributeGroupSchema>) {
    const { input } = context;

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

    const attributeRows = await this.db
      .selectFrom("product_attribute_group_attributes")
      .innerJoin(
        "product_attributes",
        "product_attributes.id",
        "product_attribute_group_attributes.attribute_id"
      )
      .where("product_attribute_group_attributes.attribute_group_id", "=", input.id)
      .where("product_attributes.deleted_at", "is", null)
      .select([
        "product_attributes.id",
        "product_attributes.title",
        "product_attributes.type",
      ])
      .execute();

    type AttrRow = { id?: string; title?: string; type?: string; "product_attributes.id"?: string; "product_attributes.title"?: string; "product_attributes.type"?: string };
    const attributes = (attributeRows as AttrRow[]).map((row) => ({
      id: String(row.id ?? row["product_attributes.id"] ?? ""),
      title: String(row.title ?? row["product_attributes.title"] ?? ""),
      type: String(row.type ?? row["product_attributes.type"] ?? ""),
    }));

    return { ...group, attributes };
  }
}
