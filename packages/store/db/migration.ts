import { Kysely, sql } from "kysely";

export async function up(db: Kysely<any>) {
  await sql`
    CREATE TABLE IF NOT EXISTS stores (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      default_currency_code text,
      default_sales_channel_id uuid,
      default_region_id uuid,
      default_location_id uuid,
      metadata jsonb,
      created_at timestamptz NOT NULL DEFAULT now(),
      updated_at timestamptz NOT NULL DEFAULT now(),
      deleted_at timestamptz
    )
  `.execute(db);
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("stores").execute();
}
