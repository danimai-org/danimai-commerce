import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai Cart Module data models.
 */

export async function up(db: Kysely<unknown>) {
  // Carts
  await db.schema
    .createTable("carts")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("email", "text")
    .addColumn("currency_code", "text")
    .addColumn("region_id", "text")
    .addColumn("customer_id", "text")
    .addColumn("type", "text")
    .addColumn("completed_at", "timestamptz")
    .addColumn("payment_authorized_at", "timestamptz")
    .addColumn("shipping_address_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart addresses
  await db.schema
    .createTable("cart_addresses")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("cart_id", "uuid", (col) =>
      col.references("carts.id").onDelete("cascade")
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

  // Cart line items
  await db.schema
    .createTable("cart_line_items")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("cart_id", "uuid", (col) =>
      col.references("carts.id").onDelete("cascade")
    )
    .addColumn("title", "text")
    .addColumn("description", "text")
    .addColumn("thumbnail", "text")
    .addColumn("variant_id", "text")
    .addColumn("product_id", "text")
    .addColumn("quantity", "integer")
    .addColumn("unit_price", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart line item adjustments
  await db.schema
    .createTable("cart_line_item_adjustments")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("line_item_id", "uuid", (col) =>
      col.references("cart_line_items.id").onDelete("cascade")
    )
    .addColumn("code", "text")
    .addColumn("amount", "text")
    .addColumn("description", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart line item tax lines
  await db.schema
    .createTable("cart_line_item_tax_lines")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("line_item_id", "uuid", (col) =>
      col.references("cart_line_items.id").onDelete("cascade")
    )
    .addColumn("description", "text")
    .addColumn("code", "text")
    .addColumn("rate", "text")
    .addColumn("provider_id", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart credit lines
  await db.schema
    .createTable("cart_credit_lines")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("cart_id", "uuid", (col) =>
      col.references("carts.id").onDelete("cascade")
    )
    .addColumn("code", "text")
    .addColumn("amount", "text")
    .addColumn("description", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart shipping methods
  await db.schema
    .createTable("cart_shipping_methods")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("cart_id", "uuid", (col) =>
      col.references("carts.id").onDelete("cascade")
    )
    .addColumn("name", "text")
    .addColumn("shipping_option_id", "text")
    .addColumn("amount", "text")
    .addColumn("data", "jsonb")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart shipping method tax lines
  await db.schema
    .createTable("cart_shipping_method_tax_lines")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("shipping_method_id", "uuid", (col) =>
      col.references("cart_shipping_methods.id").onDelete("cascade")
    )
    .addColumn("description", "text")
    .addColumn("code", "text")
    .addColumn("rate", "text")
    .addColumn("provider_id", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Cart shipping method adjustments
  await db.schema
    .createTable("cart_shipping_method_adjustments")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("shipping_method_id", "uuid", (col) =>
      col.references("cart_shipping_methods.id").onDelete("cascade")
    )
    .addColumn("code", "text")
    .addColumn("amount", "text")
    .addColumn("description", "text")
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
  await db.schema.dropTable("cart_shipping_method_adjustments").execute();
  await db.schema.dropTable("cart_shipping_method_tax_lines").execute();
  await db.schema.dropTable("cart_shipping_methods").execute();
  await db.schema.dropTable("cart_credit_lines").execute();
  await db.schema.dropTable("cart_line_item_tax_lines").execute();
  await db.schema.dropTable("cart_line_item_adjustments").execute();
  await db.schema.dropTable("cart_line_items").execute();
  await db.schema.dropTable("cart_addresses").execute();
  await db.schema.dropTable("carts").execute();
}
