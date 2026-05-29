import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Customers
  await db.schema
    .createTable("customers")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("first_name", "text")
    .addColumn("last_name", "text")
    .addColumn("phone", "text")
    .addColumn("has_account", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("active", "boolean", (col) => col.notNull().defaultTo(true))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Customer Groups
  await db.schema
    .createTable("customer_groups")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Customer Addresses (must be created after customers)
  await db.schema
    .createTable("customer_addresses")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("customer_id", "uuid", (col) =>
      col.notNull().references("customers.id").onDelete("cascade"),
    )
    .addColumn("first_name", "text")
    .addColumn("last_name", "text")
    .addColumn("phone", "text")
    .addColumn("company", "text")
    .addColumn("address_1", "text", (col) => col.notNull())
    .addColumn("address_2", "text")
    .addColumn("city", "text", (col) => col.notNull())
    .addColumn("country_code", "text", (col) => col.notNull())
    .addColumn("province", "text")
    .addColumn("postal_code", "text")
    .addColumn("is_default", "boolean", (col) =>
      col.notNull().defaultTo(false),
    )
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Customer Group Customers (pivot table - must be created after customers and customer_groups)
  await db.schema
    .createTable("customer_group_customers")
    .addColumn("customer_id", "uuid", (col) =>
      col.notNull().references("customers.id").onDelete("cascade"),
    )
    .addColumn("customer_group_id", "uuid", (col) =>
      col.notNull().references("customer_groups.id").onDelete("cascade"),
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addPrimaryKeyConstraint("customer_group_customers_pk", [
      "customer_id",
      "customer_group_id",
    ])
    .execute();

  // Auth providers — password / OAuth credentials per customer
  await db.schema
    .createTable("auth_providers")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("customer_id", "uuid", (col) =>
      col.notNull().references("customers.id").onDelete("cascade"),
    )
    .addColumn("provider_type", "text", (col) => col.notNull())
    .addColumn("provider_name", "text", (col) => col.notNull())
    .addColumn("provider_account_id", "text", (col) => col.notNull())
    .addColumn("password_hash", "text")
    .addColumn("access_token", "text")
    .addColumn("refresh_token", "text")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("auth_providers_customer_provider_unique")
    .on("auth_providers")
    .columns(["customer_id", "provider_type", "provider_name"])
    .unique()
    .execute();

  // Customer sessions — one row per login session
  await db.schema
    .createTable("customer_sessions")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("customer_id", "uuid", (col) =>
      col.references("customers.id").onDelete("cascade"),
    )
    .addColumn("parent_id", "uuid", (col) =>
      col.references("customer_sessions.id").onDelete("set null"),
    )
    .addColumn("refresh_token_hash", "text")
    .addColumn("ip_address", "text")
    .addColumn("user_agent", "text")
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("logged_out_at", "timestamptz")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();

  await db.schema
    .createIndex("customer_sessions_customer_id_expires_at_index")
    .on("customer_sessions")
    .columns(["customer_id", "expires_at"])
    .execute();
  await db.schema
    .createIndex("customer_sessions_expires_at_index")
    .on("customer_sessions")
    .column("expires_at")
    .execute();

  // One-time tokens (signup verify, password reset)
  await db.schema
    .createTable("customer_tokens")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("customer_id", "uuid", (col) =>
      col.notNull().references("customers.id").onDelete("cascade"),
    )
    .addColumn("token_hash", "text", (col) => col.notNull().unique())
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("expires_at", "timestamptz", (col) => col.notNull())
    .addColumn("used_at", "timestamptz")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("customer_tokens").execute();
  await db.schema.dropTable("customer_sessions").execute();
  await db.schema.dropTable("auth_providers").execute();
  await db.schema.dropTable("customer_group_customers").execute();
  await db.schema.dropTable("customer_addresses").execute();
  await db.schema.dropTable("customer_groups").execute();
  await db.schema.dropTable("customers").execute();
}
