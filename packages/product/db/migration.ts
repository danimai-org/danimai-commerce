import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Product Collections
  await db.schema
    .createTable("product_collections")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("handle", "text", (col) => col.notNull().unique())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Categories
  await db.schema
    .createTable("product_categories")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("parent_id", "uuid", (col) => 
        col.references("product_categories.id")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Tags
  await db.schema
    .createTable("product_tags")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Products
  await db.schema
    .createTable("products")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("handle", "text", (col) => col.notNull().unique())
    .addColumn("subtitle", "text")
    .addColumn("description", "text")
    .addColumn("is_giftcard", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("thumbnail", "text")
    .addColumn("discountable", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("external_id", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("category_id", "uuid", (col) => col.references("product_categories.id")) // Added category_id
    // Removed type_id, collection_id
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Images (Renamed from images)
  await db.schema
    .createTable("product_images")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("url", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("rank", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("product_id", "uuid", (col) => col.references("products.id"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Attributes
  await db.schema
    .createTable("product_attributes")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();
    
  // Product Variants
  await db.schema
    .createTable("product_variants")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("sku", "text")
    .addColumn("barcode", "text")
    .addColumn("ean", "text")
    .addColumn("upc", "text")
    .addColumn("allow_backorder", "boolean", (col) =>
      col.notNull().defaultTo(false)
    )
    .addColumn("manage_inventory", "boolean", (col) =>
      col.notNull().defaultTo(true)
    )
    .addColumn("metadata", "jsonb")
    .addColumn("variant_rank", "integer")
    .addColumn("thumbnail", "text")
    .addColumn("product_id", "uuid", (col) =>
      col.references("products.id")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Attribute Values
  await db.schema
    .createTable("product_attribute_values")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("attribute_id", "uuid", (col) =>
        col.references("product_attributes.id").onDelete("cascade")
    )
    .addColumn("product_id", "uuid", (col) =>
        col.references("products.id").onDelete("cascade")
    )
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Variant Attribute Values
  await db.schema
    .createTable("variant_attribute_values")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("attribute_id", "uuid", (col) =>
        col.references("product_attributes.id").onDelete("cascade")
    )
    .addColumn("variant_id", "uuid", (col) =>
        col.references("product_variants.id").onDelete("cascade")
    )
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Options
  await db.schema
    .createTable("product_options")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("product_id", "uuid", (col) =>
      col.references("products.id")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Option Values
  await db.schema
    .createTable("product_option_values")
    .addColumn("id", "uuid", (col) => col.primaryKey())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("option_id", "uuid", (col) =>
      col.references("product_options.id")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Product Tag Relations (Renamed from products_tags)
  await db.schema
    .createTable("product_tag_relations") 
    .addColumn("product_id", "uuid", (col) =>
      col.notNull().references("products.id").onDelete("cascade")
    )
    .addColumn("product_tag_id", "uuid", (col) =>
      col.notNull().references("product_tags.id").onDelete("cascade")
    )
    .addPrimaryKeyConstraint("product_tag_relations_pk", ["product_id", "product_tag_id"])
    .execute();

  // Product Collection Relations (New)
  await db.schema
    .createTable("product_collection_relations")
    .addColumn("product_id", "uuid", (col) =>
      col.notNull().references("products.id").onDelete("cascade")
    )
    .addColumn("product_collection_id", "uuid", (col) =>
      col.notNull().references("product_collections.id").onDelete("cascade")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addPrimaryKeyConstraint("product_collection_relations_pk", [
      "product_id",
      "product_collection_id",
    ])
    .execute();

  // Product Variant Option Relations (Renamed from product_variants_options)
  await db.schema
    .createTable("product_variant_option_relations")
    .addColumn("variant_id", "uuid", (col) =>
      col.notNull().references("product_variants.id").onDelete("cascade")
    )
    .addColumn("option_value_id", "uuid", (col) =>
      col.notNull().references("product_option_values.id").onDelete("cascade")
    )
    .addPrimaryKeyConstraint("product_variant_option_relations_pk", [
      "variant_id",
      "option_value_id",
    ])
    .execute();

  // Product Variant Image Relations (Renamed from product_variants_images)
  await db.schema
    .createTable("product_variant_image_relations")
    .addColumn("variant_id", "uuid", (col) =>
      col.notNull().references("product_variants.id").onDelete("cascade")
    )
    .addColumn("image_id", "uuid", (col) =>
      col.notNull().references("product_images.id").onDelete("cascade")
    )
    .addPrimaryKeyConstraint("product_variant_image_relations_pk", [
      "variant_id",
      "image_id",
    ])
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("product_variant_image_relations").execute();
  await db.schema.dropTable("product_variant_option_relations").execute();
  await db.schema.dropTable("product_collection_relations").execute();
  await db.schema.dropTable("product_tag_relations").execute();
  await db.schema.dropTable("product_option_values").execute();
  await db.schema.dropTable("product_options").execute();
  await db.schema.dropTable("variant_attribute_values").execute();
  await db.schema.dropTable("product_attribute_values").execute();
  await db.schema.dropTable("product_variants").execute(); 
  await db.schema.dropTable("product_attributes").execute();
  await db.schema.dropTable("product_images").execute();
  await db.schema.dropTable("products").execute();
  await db.schema.dropTable("product_tags").execute();
  await db.schema.dropTable("product_categories").execute();
  await db.schema.dropTable("product_collections").execute();
}
