import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Regions
  await db.schema
    .createTable("regions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Countries (must be created after regions)
  await db.schema
    .createTable("countries")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("iso_2", "text", (col) => col.notNull().unique())
    .addColumn("iso_3", "text", (col) => col.notNull().unique())
    .addColumn("num_code", "integer", (col) => col.notNull().unique())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("display_name", "text", (col) => col.notNull())
    .addColumn("region_id", "uuid", (col) =>
      col.references("regions.id").onDelete("set null")
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
  await db.schema.dropTable("countries").execute();
  await db.schema.dropTable("regions").execute();
}
