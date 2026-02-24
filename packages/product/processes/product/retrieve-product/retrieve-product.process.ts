import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { RetrieveProductSchema } from "./retrieve-product.schema";
import type { Database, Product } from "../../../db/type";

export type RetrieveProductResult = Product & {
  collection: { id: string; title: string; handle: string } | null;
  collections: Array<{ id: string; title: string; handle: string }>;
  collection_ids: string[];
  attributes: Array<{ id: string; title: string; type: string; value: string }>;
  tag_ids: string[];
  tags: Array<{ id: string; value: string }>;
};

export const RETRIEVE_PRODUCT_PROCESS = Symbol("RetrieveProduct");

@Process(RETRIEVE_PRODUCT_PROCESS)
export class RetrieveProductProcess
  implements ProcessContract<RetrieveProductResult | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductSchema,
  }) context: ProcessContextType<typeof RetrieveProductSchema>) {
    const { input } = context;

    const product = await this.db
      .selectFrom("products")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!product) {
      throw new ValidationError("Product not found", [{
        type: "not_found",
        message: "Product not found",
        path: "id",
      }]);
    }

    const collectionRows = await this.db
      .selectFrom("product_collection_relations")
      .innerJoin(
        "product_collections",
        "product_collections.id",
        "product_collection_relations.product_collection_id"
      )
      .where("product_collection_relations.product_id", "=", input.id)
      .where("product_collections.deleted_at", "is", null)
      .select(["product_collections.id", "product_collections.title", "product_collections.handle"])
      .execute();

    const collections = collectionRows.map((row) => ({
      id: row.id,
      title: row.title,
      handle: row.handle,
    }));
    const collection_ids = collections.map((c) => c.id);
    const collection: { id: string; title: string; handle: string } | null =
      collections.length > 0 ? (collections[0] ?? null) : null;

    const attributeRows = await this.db
      .selectFrom("product_attribute_values")
      .innerJoin(
        "product_attributes",
        "product_attributes.id",
        "product_attribute_values.attribute_id"
      )
      .innerJoin(
        "product_attribute_group_attributes",
        (join) =>
          join
            .onRef("product_attribute_group_attributes.attribute_group_id", "=", "product_attribute_values.attribute_group_id")
            .onRef("product_attribute_group_attributes.attribute_id", "=", "product_attribute_values.attribute_id")
      )
      .innerJoin("products", "products.id", "product_attribute_values.product_id")
      .where("product_attribute_values.product_id", "=", input.id)
      .where("product_attribute_values.deleted_at", "is", null)
      .where("product_attributes.deleted_at", "is", null)
      .where(
        sql`(
          EXISTS (
            SELECT 1 FROM product_attribute_group_relations pagr
            WHERE pagr.product_id = product_attribute_values.product_id
              AND pagr.attribute_group_id = product_attribute_values.attribute_group_id
          )
          OR products.attribute_group_id = product_attribute_values.attribute_group_id
        )`
      )
      .select([
        "product_attributes.id",
        "product_attributes.title",
        "product_attributes.type",
        "product_attribute_values.value",
      ])
      .execute();

    const attributes = attributeRows.map((row) => ({
      id: row.id,
      title: row.title,
      type: row.type,
      value: row.value,
    }));

    const tagRows = await this.db
      .selectFrom("product_tag_relations")
      .innerJoin(
        "product_tags",
        "product_tags.id",
        "product_tag_relations.product_tag_id"
      )
      .where("product_tag_relations.product_id", "=", input.id)
      .where("product_tags.deleted_at", "is", null)
      .select(["product_tags.id", "product_tags.value"])
      .execute();

    const tags = tagRows.map((row) => ({
      id: row.id,
      value: row.value,
    }));
    const tag_ids = tags.map((t) => t.id);

    return { ...product, collection, collections, collection_ids, attributes, tag_ids, tags };
  }
}
