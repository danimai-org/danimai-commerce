import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import { RetrieveProductSchema, type RetrieveProductProcessOutput } from "./retrieve-product.schema";
import type { Database, Product } from "../../../db/type";
import type { Static } from "@sinclair/typebox";


export const RETRIEVE_PRODUCT_PROCESS = Symbol("RetrieveProduct");

@Process(RETRIEVE_PRODUCT_PROCESS)
export class RetrieveProductProcess
  implements ProcessContract<typeof RetrieveProductSchema, RetrieveProductProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveProductSchema,
  }) context: ProcessContextType<typeof RetrieveProductSchema>) {
    const { input } = context;

    const product = await this.db
      .selectFrom("products")
      .where("products.id", "=", input.id)
      .where("products.deleted_at", "is", null)
      // Product Categories
      .leftJoin("product_categories", (join) =>
        join
          .onRef("product_categories.id", "=", "products.category_id")
          .on("product_categories.deleted_at", "is", null),
    )
      // Product Collections
      .leftJoin("product_collection_relations", "product_collection_relations.product_id", "products.id")
      .leftJoin("product_collections", (join) =>
        join
          .onRef("product_collections.id", "=", "product_collection_relations.product_collection_id")
          .on("product_collections.deleted_at", "is", null),
    )
      // Product Attribute Group
      .leftJoin("product_attribute_groups", (join) =>
        join
          .onRef("product_attribute_groups.id", "=", "products.attribute_group_id")
          .on("product_attribute_groups.deleted_at", "is", null),
      )
      // Product Attribute Values
      .leftJoin("product_attribute_values", (join) =>
        join
          .onRef("product_attribute_values.product_id", "=", "products.id")
          .on("product_attribute_values.deleted_at", "is", null),
      )
      .leftJoin("product_attributes", (join) =>
        join
          .onRef("product_attributes.id", "=", "product_attribute_values.attribute_id")
          .on("product_attributes.deleted_at", "is", null),
    )
      // Product Tags
      .leftJoin("product_tag_relations", "product_tag_relations.product_id", "products.id")
      .leftJoin("product_tags", (join) =>
        join
          .onRef("product_tags.id", "=", "product_tag_relations.product_tag_id")
          .on("product_tags.deleted_at", "is", null),
    )
      // Product Sales Channels
      .leftJoin("product_sales_channels", "product_sales_channels.product_id", "products.id")
      .leftJoin("sales_channels", (join) =>
        join
          .onRef("sales_channels.id", "=", "product_sales_channels.sales_channel_id")
          .on("sales_channels.deleted_at", "is", null),
    )
      // Product Options
      .leftJoin("product_option_values", (join) =>
        join
      .onRef("product_option_values.product_id", "=", "products.id")
      .on("product_option_values.deleted_at", "is", null),
    )
    .leftJoin("product_options", "product_options.id", "product_option_values.option_id")
      // Product Variants
      .leftJoin("product_variants", "product_variants.product_id", "products.id")
      .leftJoin("product_variant_option_relations", (join) =>
        join
          .onRef("product_variant_option_relations.variant_id", "=", "product_variants.id")
    )
      .select([
        "products.id",
        "products.title",
        "products.handle",
        "products.description",
        "products.created_at",
        "products.updated_at",
        "products.metadata",
       "products.status",
       "products.discountable",
       "products.is_giftcard",
       () =>  sql<Static<typeof RetrieveProductSchema["category"]> | null>`
        CASE
          WHEN product_categories.id IS NULL THEN NULL
          ELSE jsonb_build_object(
            'id', product_categories.id, 
            'value', product_categories.value
          )
        END
       `.as('category'),
       () =>  sql<Static<typeof RetrieveProductSchema["collections"]>[]>`
        CASE
          WHEN count(product_collections.id) = 0 
          THEN ARRAY[]::json[]
          ELSE array_agg(
            DISTINCT jsonb_build_object(
              'id', product_collections.id, 
              'title', product_collections.title,
              'handle', product_collections.handle
            )
          )::json[]
        END
       `.as('collections'),
       () =>  sql<Static<typeof RetrieveProductSchema["attributes"]>[]>`
        CASE
          WHEN count(product_attributes.id) = 0 THEN ARRAY[]::json[]
          ELSE array_agg(
            DISTINCT jsonb_build_object(
            'id', product_attributes.id, 
            'title', product_attributes.title,
            'type', product_attributes.type,
            'value', product_attribute_values.value,
            'attribute_group_id', product_attribute_values.attribute_group_id
          ))::json[]
        END
       `.as('attributes'),
       () =>  sql<Static<typeof RetrieveProductSchema["tags"]>[]>`
        CASE
          WHEN count(product_tags.id) = 0 
          THEN ARRAY[]::json[]
          ELSE array_agg(
            DISTINCT jsonb_build_object(
              'id', product_tags.id, 
              'value', product_tags.value
            )
          )::json[]
        END
       `.as('tags'),
       () =>  sql<Static<typeof RetrieveProductSchema["sales_channels"]>[]>`
        CASE
          WHEN count(sales_channels.id) = 0 THEN ARRAY[]::json[]
          ELSE array_agg(
            DISTINCT jsonb_build_object(
              'id', sales_channels.id,
              'name', sales_channels.name
            )
          )::json[]
        END
       `.as('sales_channels'),
      //  () =>  sql<Static<typeof RetrieveProductSchema["options"]>[]>`
      ])
      .groupBy([
        "products.id",
        "products.title",
        "products.handle",
        "product_categories.id",
        "products.status",
        "products.metadata",
      ])
      .executeTakeFirst();

    if (!product) {
      throw new NotFoundError("Product not found");
    }

    return product;
  }
}
