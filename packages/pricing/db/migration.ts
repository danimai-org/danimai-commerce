import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Price Sets
  await db.schema
    .createTable("price_sets")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Price Lists
  await db.schema
    .createTable("price_lists")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("type", "text", (col) => col.notNull()) // "sale" | "override"
    .addColumn("status", "text", (col) => col.notNull()) // "active" | "draft"
    .addColumn("starts_at", "timestamptz")
    .addColumn("ends_at", "timestamptz")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Prices (must be created after price_sets and price_lists)
  await db.schema
    .createTable("prices")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("price_set_id", "uuid", (col) =>
      col.notNull().references("price_sets.id").onDelete("cascade")
    )
    .addColumn("amount", "text", (col) => col.notNull()) // Decimal as string
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("min_quantity", "integer")
    .addColumn("max_quantity", "integer")
    .addColumn("price_list_id", "uuid", (col) =>
      col.references("price_lists.id").onDelete("set null")
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

  // Price Rules (must be created after prices)
  await db.schema
    .createTable("price_rules")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("price_id", "uuid", (col) =>
      col.notNull().references("prices.id").onDelete("cascade")
    )
    .addColumn("rule_type", "text", (col) => col.notNull())
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

  // Price List Rules
  await db.schema
    .createTable("price_list_rules")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("price_list_id", "uuid", (col) =>
      col.notNull().references("price_lists.id").onDelete("cascade")
    )
    .addColumn("rule_type", "text", (col) => col.notNull())
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

  // Price Preferences
  await db.schema
    .createTable("price_preferences")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("price_set_id", "uuid", (col) =>
      col.notNull().references("price_sets.id").onDelete("cascade")
    )
    .addColumn("currency_code", "text")
    .addColumn("region_id", "uuid")
    .addColumn("customer_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("price_preferences").execute();
  await db.schema.dropTable("prices").execute();
  await db.schema.dropTable("price_list_rules").execute();
  await db.schema.dropTable("price_rules").execute();
  await db.schema.dropTable("price_lists").execute();
  await db.schema.dropTable("price_sets").execute();
}
