import { Kysely, sql } from "kysely";

function isAlreadyExistsError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  const code = (err as { code?: string })?.code;
  return code === "42P07" || /already exists/i.test(msg);
}

async function createTableIfNotExists(
  db: Kysely<any>,
  fn: () => ReturnType<Kysely<any>["schema"]["createTable"]>,
) {
  try {
    await fn().execute();
  } catch (err) {
    if (!isAlreadyExistsError(err)) throw err;
  }
}

export async function up(db: Kysely<any>) {
  // Sales Channels
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("sales_channels")
      .addColumn("id", "uuid", (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn("name", "text", (col) => col.notNull())
      .addColumn("description", "text")
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
      .addColumn("deleted_at", "timestamptz"),
  );

  // Product Sales Channels (junction table)
  await createTableIfNotExists(db, () =>
    db.schema
      .createTable("product_sales_channels")
      .addColumn("id", "uuid", (col) =>
        col.primaryKey().defaultTo(sql`gen_random_uuid()`),
      )
      .addColumn("product_id", "uuid", (col) =>
        col.notNull().references("products.id").onDelete("cascade"),
      )
      .addColumn("sales_channel_id", "uuid", (col) =>
        col.notNull().references("sales_channels.id").onDelete("cascade"),
      )
      .addColumn("created_at", "timestamptz", (col) =>
        col.notNull().defaultTo(sql`now()`),
      )
      .addUniqueConstraint("product_sales_channel_unique", [
        "product_id",
        "sales_channel_id",
      ]),
  );
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("product_sales_channels").execute();
  await db.schema.dropTable("sales_channels").execute();
}
