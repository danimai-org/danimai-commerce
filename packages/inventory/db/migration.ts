import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Inventory Items
  await db.schema
    .createTable("inventory_items")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("sku", "text")
    .addColumn("requires_shipping", "boolean", (col) =>
      col.notNull().defaultTo(true)
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

  await db.schema
    .createIndex("inventory_items_sku_unique_active_idx")
    .on("inventory_items")
    .column("sku")
    .unique()
    .execute();

  // Inventory Levels (must be created after inventory_items)
  await db.schema
    .createTable("inventory_levels")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("inventory_item_id", "uuid", (col) =>
      col.notNull().references("inventory_items.id").onDelete("cascade")
    )
    .addColumn("location_id", "uuid", (col) => col.notNull())
    .addColumn("stocked_quantity", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("reserved_quantity", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("available_quantity", "integer", (col) => col.notNull().defaultTo(0))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .addCheckConstraint(
      "inventory_levels_stocked_non_negative_chk",
      sql`stocked_quantity >= 0`
    )
    .addCheckConstraint(
      "inventory_levels_reserved_non_negative_chk",
      sql`reserved_quantity >= 0`
    )
    .addCheckConstraint(
      "inventory_levels_available_non_negative_chk",
      sql`available_quantity >= 0`
    )
    .addCheckConstraint(
      "inventory_levels_available_formula_chk",
      sql`available_quantity = stocked_quantity - reserved_quantity`
    )
    .execute();

  await db.schema
    .createIndex("inventory_levels_inventory_item_location_unique_active_idx")
    .on("inventory_levels")
    .columns(["inventory_item_id", "location_id"])
    .unique()
    .execute();

  // Reservation Items (must be created after inventory_items)
  await db.schema
    .createTable("reservation_items")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("inventory_item_id", "uuid", (col) =>
      col.notNull().references("inventory_items.id").onDelete("cascade")
    )
    .addColumn("location_id", "uuid", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("line_item_id", "uuid")
    .addColumn("description", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .addCheckConstraint(
      "reservation_items_quantity_positive_chk",
      sql`quantity > 0`
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("reservation_items").execute();
  await db.schema.dropTable("inventory_levels").execute();
  await db.schema.dropTable("inventory_items").execute();
}
