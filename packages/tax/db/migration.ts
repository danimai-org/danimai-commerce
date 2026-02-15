import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Tax Providers
  await db.schema
    .createTable("tax_providers")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("is_installed", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Tax Regions (must be created after tax_providers)
  await db.schema
    .createTable("tax_regions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("tax_provider_id", "uuid", (col) =>
      col.references("tax_providers.id").onDelete("set null")
    )
    .addColumn("parent_id", "uuid", (col) =>
      col.references("tax_regions.id").onDelete("set null")
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

  // Tax Rates (must be created after tax_regions)
  await db.schema
    .createTable("tax_rates")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("tax_region_id", "uuid", (col) =>
      col.notNull().references("tax_regions.id").onDelete("cascade")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("code", "text")
    .addColumn("rate", "text", (col) => col.notNull()) // Decimal as string for precision
    .addColumn("is_combinable", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Tax Rate Rules (must be created after tax_rates)
  await db.schema
    .createTable("tax_rate_rules")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("tax_rate_id", "uuid", (col) =>
      col.notNull().references("tax_rates.id").onDelete("cascade")
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
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("tax_rate_rules").execute();
  await db.schema.dropTable("tax_rates").execute();
  await db.schema.dropTable("tax_regions").execute();
  await db.schema.dropTable("tax_providers").execute();
}
