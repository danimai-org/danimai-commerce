import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai Fulfillment Module data models.
 */

export async function up(db: Kysely<unknown>) {
  // Fulfillment sets (e.g. shipping, pick-up)
  await db.schema
    .createTable("fulfillment_sets")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("type", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Fulfillment providers (e.g. manual, fedex)
  await db.schema
    .createTable("fulfillment_providers")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Fulfillment addresses (delivery address)
  await db.schema
    .createTable("fulfillment_addresses")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
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

  // Service zones (collection of geo zones, restricts shipping options)
  await db.schema
    .createTable("service_zones")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("fulfillment_set_id", "uuid", (col) =>
      col.references("fulfillment_sets.id").onDelete("cascade")
    )
    .addColumn("name", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Geo zones (country, province, city, postal_expression)
  await db.schema
    .createTable("geo_zones")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("service_zone_id", "uuid", (col) =>
      col.references("service_zones.id").onDelete("cascade")
    )
    .addColumn("type", "text")
    .addColumn("country_code", "text")
    .addColumn("province_code", "text")
    .addColumn("city", "text")
    .addColumn("postal_expression", "jsonb")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Shipping profiles (e.g. default, digital)
  await db.schema
    .createTable("shipping_profiles")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("type", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Shipping option types (e.g. express, standard)
  await db.schema
    .createTable("shipping_option_types")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("label", "text")
    .addColumn("code", "text")
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

  // Shipping options (offered by provider, restricted by service zone)
  await db.schema
    .createTable("shipping_options")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("service_zone_id", "uuid", (col) =>
      col.references("service_zones.id").onDelete("cascade")
    )
    .addColumn("shipping_profile_id", "uuid", (col) =>
      col.references("shipping_profiles.id").onDelete("set null")
    )
    .addColumn("shipping_option_type_id", "uuid", (col) =>
      col.references("shipping_option_types.id").onDelete("set null")
    )
    .addColumn("provider_id", "uuid", (col) =>
      col.references("fulfillment_providers.id").onDelete("set null")
    )
    .addColumn("price_type", "text")
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

  // Shipping option rules (attribute, operator, value)
  await db.schema
    .createTable("shipping_option_rules")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("shipping_option_id", "uuid", (col) =>
      col.references("shipping_options.id").onDelete("cascade")
    )
    .addColumn("attribute", "text")
    .addColumn("operator", "text")
    .addColumn("value", "jsonb")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Fulfillments (instance of fulfilling items via shipping option)
  await db.schema
    .createTable("fulfillments")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("location_id", "text")
    .addColumn("shipping_option_id", "uuid", (col) =>
      col.references("shipping_options.id").onDelete("set null")
    )
    .addColumn("provider_id", "uuid", (col) =>
      col.references("fulfillment_providers.id").onDelete("set null")
    )
    .addColumn("delivery_address_id", "uuid", (col) =>
      col.references("fulfillment_addresses.id").onDelete("set null")
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

  // Fulfillment items (line items in a fulfillment)
  await db.schema
    .createTable("fulfillment_items")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("fulfillment_id", "uuid", (col) =>
      col.references("fulfillments.id").onDelete("cascade")
    )
    .addColumn("item_id", "text")
    .addColumn("quantity", "integer")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Fulfillment labels (tracking)
  await db.schema
    .createTable("fulfillment_labels")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("fulfillment_id", "uuid", (col) =>
      col.references("fulfillments.id").onDelete("cascade")
    )
    .addColumn("tracking_number", "text")
    .addColumn("tracking_url", "text")
    .addColumn("label_url", "text")
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
  await db.schema.dropTable("fulfillment_labels").execute();
  await db.schema.dropTable("fulfillment_items").execute();
  await db.schema.dropTable("fulfillments").execute();
  await db.schema.dropTable("shipping_option_rules").execute();
  await db.schema.dropTable("shipping_options").execute();
  await db.schema.dropTable("shipping_option_types").execute();
  await db.schema.dropTable("shipping_profiles").execute();
  await db.schema.dropTable("geo_zones").execute();
  await db.schema.dropTable("service_zones").execute();
  await db.schema.dropTable("fulfillment_addresses").execute();
  await db.schema.dropTable("fulfillment_providers").execute();
  await db.schema.dropTable("fulfillment_sets").execute();
}
