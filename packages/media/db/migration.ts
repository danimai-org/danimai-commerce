import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await db.schema
    .createTable("media_files")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("provider", "text", (col) => col.notNull())
    .addColumn("bucket", "text", (col) => col.notNull())
    .addColumn("region", "text", (col) => col.notNull())
    .addColumn("object_key", "text", (col) => col.notNull().unique())
    .addColumn("url", "text", (col) => col.notNull())
    .addColumn("etag", "text")
    .addColumn("filename", "text", (col) => col.notNull())
    .addColumn("original_filename", "text", (col) => col.notNull())
    .addColumn("mime_type", "text", (col) => col.notNull())
    .addColumn("extension", "text")
    .addColumn("size", "bigint", (col) => col.notNull())
    .addColumn("checksum", "text")
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("owner_type", "text")
    .addColumn("owner_id", "uuid")
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
    .createIndex("idx_media_files_type_created_at")
    .on("media_files")
    .columns(["type", "created_at"])
    .execute();

  await db.schema
    .createIndex("idx_media_files_owner")
    .on("media_files")
    .columns(["owner_type", "owner_id"])
    .execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("media_files").execute();
}
