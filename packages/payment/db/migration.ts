import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai Payment Module data models.
 */

export async function up(db: Kysely<unknown>) {
  // Account holders (customer/account context)
  await db.schema
    .createTable("account_holders")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("type", "text")
    .addColumn("account_id", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Payment providers (e.g. stripe, manual)
  await db.schema
    .createTable("payment_providers")
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

  // Refund reasons (e.g. duplicate, fraud, requested)
  await db.schema
    .createTable("refund_reasons")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("label", "text")
    .addColumn("value", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Payment collections (groups sessions and payments)
  await db.schema
    .createTable("payment_collections")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("amount", "text")
    .addColumn("currency_code", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // M:N: payment_collections <-> payment_providers
  await db.schema
    .createTable("payment_collection_providers")
    .addColumn("payment_collection_id", "uuid", (col) =>
      col
        .notNull()
        .references("payment_collections.id")
        .onDelete("cascade")
    )
    .addColumn("payment_provider_id", "uuid", (col) =>
      col
        .notNull()
        .references("payment_providers.id")
        .onDelete("cascade")
    )
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addPrimaryKeyConstraint("payment_collection_providers_pk", [
      "payment_collection_id",
      "payment_provider_id",
    ])
    .execute();

  // Payment sessions (amount to authorize, provider data)
  await db.schema
    .createTable("payment_sessions")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("payment_collection_id", "uuid", (col) =>
      col.references("payment_collections.id").onDelete("cascade")
    )
    .addColumn("provider_id", "uuid", (col) =>
      col.references("payment_providers.id").onDelete("set null")
    )
    .addColumn("amount", "text")
    .addColumn("currency_code", "text")
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

  // Payments (created when session authorized; has captures, refunds)
  await db.schema
    .createTable("payments")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("payment_collection_id", "uuid", (col) =>
      col.references("payment_collections.id").onDelete("set null")
    )
    .addColumn("payment_session_id", "uuid", (col) =>
      col.references("payment_sessions.id").onDelete("set null")
    )
    .addColumn("provider_id", "uuid", (col) =>
      col.references("payment_providers.id").onDelete("set null")
    )
    .addColumn("amount", "text")
    .addColumn("currency_code", "text")
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

  // Captures (incremental capture of authorized payment)
  await db.schema
    .createTable("captures")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("payment_id", "uuid", (col) =>
      col.references("payments.id").onDelete("cascade")
    )
    .addColumn("amount", "text")
    .addColumn("created_by", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Refunds (refund of captured amount)
  await db.schema
    .createTable("refunds")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("payment_id", "uuid", (col) =>
      col.references("payments.id").onDelete("cascade")
    )
    .addColumn("amount", "text")
    .addColumn("refund_reason_id", "uuid", (col) =>
      col.references("refund_reasons.id").onDelete("set null")
    )
    .addColumn("created_by", "text")
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
  await db.schema.dropTable("refunds").execute();
  await db.schema.dropTable("captures").execute();
  await db.schema.dropTable("payments").execute();
  await db.schema.dropTable("payment_sessions").execute();
  await db.schema.dropTable("payment_collection_providers").execute();
  await db.schema.dropTable("payment_collections").execute();
  await db.schema.dropTable("refund_reasons").execute();
  await db.schema.dropTable("payment_providers").execute();
  await db.schema.dropTable("account_holders").execute();
}
