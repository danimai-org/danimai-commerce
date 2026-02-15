import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  // Customers
  await db.schema
    .createTable("customers")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("email", "text", (col) => col.notNull().unique())
    .addColumn("first_name", "text")
    .addColumn("last_name", "text")
    .addColumn("phone", "text")
    .addColumn("has_account", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Customer Groups
  await db.schema
    .createTable("customer_groups")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Customer Addresses (must be created after customers)
  await db.schema
    .createTable("customer_addresses")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("customer_id", "uuid", (col) =>
      col.notNull().references("customers.id").onDelete("cascade")
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
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Customer Group Customers (pivot table - must be created after customers and customer_groups)
  await db.schema
    .createTable("customer_group_customers")
    .addColumn("customer_id", "uuid", (col) =>
      col.notNull().references("customers.id").onDelete("cascade")
    )
    .addColumn("customer_group_id", "uuid", (col) =>
      col.notNull().references("customer_groups.id").onDelete("cascade")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addPrimaryKeyConstraint("customer_group_customers_pk", [
      "customer_id",
      "customer_group_id",
    ])
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("customer_group_customers").execute();
  await db.schema.dropTable("customer_addresses").execute();
  await db.schema.dropTable("customer_groups").execute();
  await db.schema.dropTable("customers").execute();
}
