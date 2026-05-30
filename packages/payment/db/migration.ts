import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai Payment Module data models.
 */

export async function up(db: Kysely<any>) {
  // Payment providers (e.g. stripe, razorpay, paypal)
  await db.schema
    .createTable("payment_providers")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("active", "boolean", (col) => col.notNull().defaultTo(sql`true`))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  await db.insertInto("payment_providers").values({ name: "stripe" }).execute();

  // Refund reasons (e.g. duplicate, fraud, requested)
  await db.schema
    .createTable("refund_reasons")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("label", "text", (col) => col.notNull())
    .addColumn("value", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Payment customers (third-party customer sync per provider)
  await db.schema
    .createTable("payment_customers")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("customer_id", "uuid", (col) => col.notNull())
    .addColumn("stripe_customer_id", "text", (col) => col.notNull())
    .addColumn("provider_id", "uuid", (col) =>
      col.notNull().references("payment_providers.id").onDelete("restrict"),
    )
    .addColumn("metadata", "jsonb")
    .addColumn("status", "text", (col) => col.notNull().defaultTo("active"))
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Payments
  await db.schema
    .createTable("payments")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("order_id", "uuid", (col) => col.notNull())
    .addColumn("customer_id", "uuid", (col) => col.notNull())
    .addColumn("provider_id", "uuid", (col) =>
      col.notNull().references("payment_providers.id").onDelete("restrict"),
    )
    .addColumn("amount", sql`numeric(20, 4)`, (col) => col.notNull())
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("last_status", "text", (col) =>
      col.notNull().defaultTo("pending"),
    )
    .addColumn("last_transaction_id", "uuid")
    .addColumn("success_transaction_id", "uuid")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Payment transactions (provider attempt/charge per payment)
  await db.schema
    .createTable("payment_transactions")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("payment_id", "uuid", (col) =>
      col.notNull().references("payments.id").onDelete("cascade"),
    )
    .addColumn("provider_id", "uuid", (col) =>
      col.notNull().references("payment_providers.id").onDelete("restrict"),
    )
    .addColumn("amount", sql`numeric(20, 4)`, (col) => col.notNull())
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("last_status", "text", (col) =>
      col.notNull().defaultTo("pending"),
    )
    .addColumn("metadata", "jsonb")
    .addColumn("payment_intent_id", "text")
    .addColumn("checkout_id", "text")
    .addColumn("customer_id", "uuid", (col) => col.notNull())
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  await db.schema
    .alterTable("payments")
    .addForeignKeyConstraint(
      "payments_last_transaction_id_fkey",
      ["last_transaction_id"],
      "payment_transactions",
      ["id"],
    )
    .onDelete("set null")
    .execute();

  await db.schema
    .alterTable("payments")
    .addForeignKeyConstraint(
      "payments_success_transaction_id_fkey",
      ["success_transaction_id"],
      "payment_transactions",
      ["id"],
    )
    .onDelete("set null")
    .execute();

  // Refunds
  await db.schema
    .createTable("refunds")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`),
    )
    .addColumn("customer_id", "uuid", (col) => col.notNull())
    .addColumn("payment_id", "uuid", (col) =>
      col.notNull().references("payments.id").onDelete("cascade"),
    )
    .addColumn("payment_transaction_id", "uuid", (col) =>
      col.notNull().references("payment_transactions.id").onDelete("cascade"),
    )
    .addColumn("amount", sql`numeric(20, 4)`, (col) => col.notNull())
    .addColumn("refund_reason_id", "uuid", (col) =>
      col.references("refund_reasons.id").onDelete("set null"),
    )
    .addColumn("last_status", "text", (col) =>
      col.notNull().defaultTo("pending"),
    )
    .addColumn("stripe_refund_id", "text")
    .addColumn("created_by", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`),
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("refunds").execute();
  await db.schema
    .alterTable("payments")
    .dropConstraint("payments_last_transaction_id_fkey")
    .execute();
  await db.schema
    .alterTable("payments")
    .dropConstraint("payments_success_transaction_id_fkey")
    .execute();
  await db.schema.dropTable("payment_transactions").execute();
  await db.schema.dropTable("payments").execute();
  await db.schema.dropTable("payment_customers").execute();
  await db.schema.dropTable("refund_reasons").execute();
  await db.schema.dropTable("payment_providers").execute();
}
