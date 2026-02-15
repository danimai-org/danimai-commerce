import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai API Key Module data models.
 */

export async function up(db: Kysely<unknown>) {
  // API Keys (publishable or secret keys for authentication)
  await db.schema
    .createTable("api_keys")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("title", "text")
    .addColumn("token", "text")
    .addColumn("revoked_at", "timestamptz")
    .addColumn("revoked_by", "text")
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
  await db.schema.dropTable("api_keys").execute();
}
