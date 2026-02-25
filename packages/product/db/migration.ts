import { Kysely, sql } from "kysely";

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code;
  return code === "42P07" || /already exists/i.test(msg);
}

async function createTableIfNotExists(
  db: Kysely<any>,
  fn: () => ReturnType<Kysely<any>["schema"]["createTable"]>
) {
  try {
    await fn().execute();
  } catch (err) {
    if (!isAlreadyExistsError(err)) throw err;
  }
}

export async function up(db: Kysely<any>) {
  // Product Collections
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_collections")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
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
  );

  // Product Collection Relations
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_collection_relations")
    .addColumn("product_id", "uuid", (col) => col.notNull().references("products.id"))
    .addColumn("product_collection_id", "uuid", (col) => col.notNull().references("product_collections.id"))
    .addColumn("created_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) => col.notNull().defaultTo(sql`now()`)
    )
  );
  // Product Categories
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_categories")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("handle", "varchar(255)", (col) => col.notNull().unique())
    .addColumn("metadata", "jsonb")
    .addColumn("parent_id", "uuid", (col) =>
      col.references("product_categories.id")
    )
    .addColumn("status", "varchar(50)", (col) => col.notNull().defaultTo("active"))
    .addColumn("visibility", "varchar(50)", (col) => col.notNull().defaultTo("public"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
  );

  
  // Product Tags
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_tags")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
  );

  // Products
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("products")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
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
  );

  // Product Images
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_images")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
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
  );

  // Product Attributes
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_attributes")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
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
  );

  // Product Variants
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_variants")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
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
  );

  // Product Attribute Groups
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_attribute_groups")
      .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
      .addColumn("title", "text", (col) => col.notNull())
      .addColumn("metadata", "jsonb")
      .addColumn("created_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn("updated_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn("deleted_at", "timestamptz")
  );

  // Product Attribute Values
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_attribute_values")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("attribute_id", "uuid", (col) =>
      col.references("product_attributes.id").onDelete("cascade")
    )
    .addColumn("attribute_group_id", "uuid", (col) =>
      col.references("product_attribute_groups.id").onDelete("cascade")
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
  );

  // Product Attribute Group Relations (product <-> group)
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_attribute_group_relations")
      .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
      .addColumn("product_id", "uuid", (col) =>
        col.notNull().references("products.id").onDelete("cascade")
      )
      .addColumn("attribute_group_id", "uuid", (col) =>
        col.notNull().references("product_attribute_groups.id").onDelete("cascade")
      )
      .addColumn("required", "boolean", (col) => col.notNull().defaultTo(false))
      .addColumn("rank", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("created_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn("updated_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
  );

  // Product Attribute Group Attributes (which attributes are assigned to a group)
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_attribute_group_attributes")
      .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
      .addColumn("attribute_group_id", "uuid", (col) =>
        col.notNull().references("product_attribute_groups.id").onDelete("cascade")
      )
      .addColumn("attribute_id", "uuid", (col) =>
        col.notNull().references("product_attributes.id").onDelete("cascade")
      )
      .addColumn("rank", "integer", (col) => col.notNull().defaultTo(0))
      .addColumn("required", "boolean", (col) => col.notNull().defaultTo(false))
      .addColumn("created_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addColumn("updated_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`)
      )
      .addUniqueConstraint("product_attribute_group_attributes_group_attribute_unique", [
        "attribute_group_id",
        "attribute_id",
      ])
  );
  

  // Product Options (global; no product_id)
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_options")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
  );

  // Product Option Values (per option + product)
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_option_values")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("option_id", "uuid", (col) =>
      col.references("product_options.id").onDelete("cascade")
    )
    .addColumn("product_id", "uuid", (col) =>
      col.references("products.id").onDelete("cascade")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
  );

  // Product Tag Relations
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_tag_relations")
    .addColumn("product_id", "uuid", (col) =>
      col.notNull().references("products.id").onDelete("cascade")
    )
    .addColumn("product_tag_id", "uuid", (col) =>
      col.notNull().references("product_tags.id").onDelete("cascade")
    )
    .addPrimaryKeyConstraint("product_tag_relations_pk", ["product_id", "product_tag_id"])
  );

  // Product Collection Relations
  await createTableIfNotExists(db, () =>
    db.schema
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
  );

  // Product Variant Option Relations
  await createTableIfNotExists(db, () =>
    db.schema
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
  );

  // Product Variant Image Relations
  await createTableIfNotExists(db, () =>
    db.schema
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
  );

  // Align existing DBs: product_options has no product_id; product_option_values has product_id
  await sql`ALTER TABLE product_options DROP COLUMN IF EXISTS product_id`.execute(db);
  await sql`
    ALTER TABLE product_option_values
    ADD COLUMN IF NOT EXISTS product_id uuid REFERENCES products(id) ON DELETE CASCADE
  `.execute(db);

  // Attribute groups and product_attribute_values: add attribute_group_id, make product_id nullable
  await sql`ALTER TABLE products ADD COLUMN IF NOT EXISTS attribute_group_id uuid REFERENCES product_attribute_groups(id) ON DELETE SET NULL`.execute(db);
  await sql`
    ALTER TABLE product_attribute_values
    ADD COLUMN IF NOT EXISTS attribute_group_id uuid REFERENCES product_attribute_groups(id) ON DELETE CASCADE
  `.execute(db);
  await sql`ALTER TABLE product_attribute_values ALTER COLUMN product_id DROP NOT NULL`.execute(db).catch(() => {});
  await sql`ALTER TABLE product_images ADD COLUMN IF NOT EXISTS variant_id uuid REFERENCES product_variants(id) ON DELETE SET NULL`.execute(db);

  // Remove variant attribute values (replaced by group-based product attributes only)
  await sql`DROP TABLE IF EXISTS variant_attribute_values CASCADE`.execute(db);

  // Fix Studio & Training collection handle typo: studio-traning -> studio-training
  await sql`
    UPDATE product_collections
    SET handle = 'studio-training', updated_at = now()
    WHERE handle = 'studio-traning' AND deleted_at IS NULL
  `.execute(db);
}

export async function down(db: Kysely<any>) {
  const tables = [
    "product_variant_image_relations",
    "product_variant_option_relations",
    "product_collection_relations",
    "product_tag_relations",
    "product_option_values",
    "product_options",
    "product_attribute_values",
    "product_attribute_group_relations",
    "product_attribute_group_attributes",
    "product_variants",
    "product_attributes",
    "product_attribute_groups",
    "product_images",
    "products",
    "product_tags",
    "product_categories",
    "product_collections",
  ];
  for (const table of tables) {
    await sql`DROP TABLE IF EXISTS ${sql.raw(table)} CASCADE`.execute(db);
  }
}
