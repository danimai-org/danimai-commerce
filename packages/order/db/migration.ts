import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Return Reasons (created first as it's referenced by return_items)
  await db.schema
    .createTable("return_reasons")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("label", "text", (col) => col.notNull())
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

  // Order Addresses (created before orders as it's referenced)
  await db.schema
    .createTable("order_addresses")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("first_name", "text", (col) => col.notNull())
    .addColumn("last_name", "text", (col) => col.notNull())
    .addColumn("phone", "text")
    .addColumn("company", "text")
    .addColumn("address_1", "text", (col) => col.notNull())
    .addColumn("address_2", "text")
    .addColumn("city", "text", (col) => col.notNull())
    .addColumn("country_code", "text", (col) => col.notNull())
    .addColumn("province", "text")
    .addColumn("postal_code", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Orders
  await db.schema
    .createTable("orders")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("fulfillment_status", "text", (col) => col.notNull())
    .addColumn("payment_status", "text", (col) => col.notNull())
    .addColumn("display_id", "integer", (col) => col.notNull())
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("email", "text")
    .addColumn("customer_id", "uuid")
    .addColumn("sales_channel_id", "uuid")
    .addColumn("region_id", "uuid")
    .addColumn("billing_address_id", "uuid", (col) =>
      col.references("order_addresses.id").onDelete("set null")
    )
    .addColumn("shipping_address_id", "uuid", (col) =>
      col.references("order_addresses.id").onDelete("set null")
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

  // Order Items
  await db.schema
    .createTable("order_items")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_id", "uuid", (col) =>
      col.notNull().references("orders.id").onDelete("cascade")
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("subtitle", "text")
    .addColumn("thumbnail", "text")
    .addColumn("variant_id", "uuid")
    .addColumn("product_id", "uuid")
    .addColumn("product_title", "text")
    .addColumn("product_description", "text")
    .addColumn("product_subtitle", "text")
    .addColumn("product_type", "text")
    .addColumn("product_collection", "text")
    .addColumn("product_handle", "text")
    .addColumn("variant_sku", "text")
    .addColumn("variant_barcode", "text")
    .addColumn("variant_title", "text")
    .addColumn("variant_option_values", "jsonb")
    .addColumn("requires_shipping", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("is_discountable", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("is_tax_inclusive", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("compare_at_unit_price", "text")
    .addColumn("unit_price", "text", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Line Items
  await db.schema
    .createTable("order_line_items")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_id", "uuid", (col) =>
      col.notNull().references("orders.id").onDelete("cascade")
    )
    .addColumn("title", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("subtitle", "text")
    .addColumn("thumbnail", "text")
    .addColumn("variant_id", "uuid")
    .addColumn("product_id", "uuid")
    .addColumn("product_title", "text")
    .addColumn("product_description", "text")
    .addColumn("product_subtitle", "text")
    .addColumn("product_type", "text")
    .addColumn("product_collection", "text")
    .addColumn("product_handle", "text")
    .addColumn("variant_sku", "text")
    .addColumn("variant_barcode", "text")
    .addColumn("variant_title", "text")
    .addColumn("variant_option_values", "jsonb")
    .addColumn("requires_shipping", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("is_discountable", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("is_tax_inclusive", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("compare_at_unit_price", "text")
    .addColumn("unit_price", "text", (col) => col.notNull())
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Line Item Adjustments
  await db.schema
    .createTable("order_line_item_adjustments")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_line_item_id", "uuid", (col) =>
      col.notNull().references("order_line_items.id").onDelete("cascade")
    )
    .addColumn("code", "text")
    .addColumn("amount", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("promotion_id", "uuid")
    .addColumn("provider_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Line Item Tax Lines
  await db.schema
    .createTable("order_line_item_tax_lines")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_line_item_id", "uuid", (col) =>
      col.notNull().references("order_line_items.id").onDelete("cascade")
    )
    .addColumn("description", "text")
    .addColumn("tax_rate_id", "uuid")
    .addColumn("code", "text")
    .addColumn("rate", "text", (col) => col.notNull())
    .addColumn("provider_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Shipping
  await db.schema
    .createTable("order_shipping")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_id", "uuid", (col) =>
      col.notNull().references("orders.id").onDelete("cascade")
    )
    .addColumn("name", "text")
    .addColumn("amount", "text", (col) => col.notNull())
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

  // Order Shipping Methods
  await db.schema
    .createTable("order_shipping_methods")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_id", "uuid", (col) =>
      col.notNull().references("orders.id").onDelete("cascade")
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("shipping_option_id", "uuid")
    .addColumn("amount", "text", (col) => col.notNull())
    .addColumn("data", "jsonb")
    .addColumn("tax_lines", "jsonb")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Shipping Method Adjustments
  await db.schema
    .createTable("order_shipping_method_adjustments")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_shipping_method_id", "uuid", (col) =>
      col.notNull().references("order_shipping_methods.id").onDelete("cascade")
    )
    .addColumn("code", "text")
    .addColumn("amount", "text", (col) => col.notNull())
    .addColumn("description", "text")
    .addColumn("promotion_id", "uuid")
    .addColumn("provider_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Shipping Method Tax Lines
  await db.schema
    .createTable("order_shipping_method_tax_lines")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_shipping_method_id", "uuid", (col) =>
      col.notNull().references("order_shipping_methods.id").onDelete("cascade")
    )
    .addColumn("description", "text")
    .addColumn("tax_rate_id", "uuid")
    .addColumn("code", "text")
    .addColumn("rate", "text", (col) => col.notNull())
    .addColumn("provider_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Order Transactions
  await db.schema
    .createTable("order_transactions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_id", "uuid", (col) =>
      col.notNull().references("orders.id").onDelete("cascade")
    )
    .addColumn("amount", "text", (col) => col.notNull())
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("reference", "text")
    .addColumn("reference_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Returns
  await db.schema
    .createTable("returns")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("order_id", "uuid", (col) =>
      col.notNull().references("orders.id").onDelete("cascade")
    )
    .addColumn("status", "text", (col) => col.notNull())
    .addColumn("shipping_data", "jsonb")
    .addColumn("refund_amount", "text")
    .addColumn("location_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Return Items
  await db.schema
    .createTable("return_items")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("return_id", "uuid", (col) =>
      col.notNull().references("returns.id").onDelete("cascade")
    )
    .addColumn("order_item_id", "uuid", (col) =>
      col.notNull().references("order_items.id").onDelete("cascade")
    )
    .addColumn("quantity", "integer", (col) => col.notNull())
    .addColumn("reason_id", "uuid", (col) =>
      col.references("return_reasons.id").onDelete("set null")
    )
    .addColumn("note", "text")
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
  await db.schema.dropTable("return_items").execute();
  await db.schema.dropTable("returns").execute();
  await db.schema.dropTable("order_transactions").execute();
  await db.schema.dropTable("order_shipping_method_tax_lines").execute();
  await db.schema.dropTable("order_shipping_method_adjustments").execute();
  await db.schema.dropTable("order_shipping_methods").execute();
  await db.schema.dropTable("order_shipping").execute();
  await db.schema.dropTable("order_line_item_tax_lines").execute();
  await db.schema.dropTable("order_line_item_adjustments").execute();
  await db.schema.dropTable("order_line_items").execute();
  await db.schema.dropTable("order_items").execute();
  await db.schema.dropTable("orders").execute();
  await db.schema.dropTable("order_addresses").execute();
  await db.schema.dropTable("return_reasons").execute();
}
