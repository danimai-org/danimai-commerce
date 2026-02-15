import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai Stock Location Next Module data models.
 */

export async function up(db: Kysely<unknown>) {
  // Stock locations (physical location where stock items are kept, e.g. warehouse)
  await db.schema
    .createTable("stock_locations")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("address_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Stock location addresses (address details of a stock location)
  await db.schema
    .createTable("stock_location_addresses")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("stock_location_id", "uuid", (col) =>
      col.references("stock_locations.id").onDelete("cascade")
    )
    .addColumn("address_1", "text")
    .addColumn("address_2", "text")
    .addColumn("company", "text")
    .addColumn("city", "text")
    .addColumn("province", "text")
    .addColumn("postal_code", "text")
    .addColumn("country_code", "text")
    .addColumn("phone", "text")
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

export async function down(db: Kysely<unknown>) {
  await db.schema.dropTable("stock_locations").execute();
  await db.schema.dropTable("stock_location_addresses").execute();
}
