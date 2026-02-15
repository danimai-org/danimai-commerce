import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Currencies
  await db.schema
    .createTable("currencies")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("code", "text", (col) => col.notNull().unique())
    .addColumn("symbol", "text", (col) => col.notNull())
    .addColumn("symbol_native", "text", (col) => col.notNull())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("tax_inclusive_pricing", "boolean", (col) =>
      col.notNull().defaultTo(false)
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
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("currencies").execute();
}
