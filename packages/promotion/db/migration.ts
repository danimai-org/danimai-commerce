import { Kysely, sql } from "kysely";

/**
 * Migration for Danimai Promotion Module data models.
 */

export async function up(db: Kysely<unknown>) {
  // Campaigns (groups promotions under same conditions)
  await db.schema
    .createTable("campaigns")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("name", "text")
    .addColumn("description", "text")
    .addColumn("campaign_identifier", "text")
    .addColumn("starts_at", "timestamptz")
    .addColumn("ends_at", "timestamptz")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Campaign budgets (limit promotion usage: spend, usage, use_by_attribute)
  await db.schema
    .createTable("campaign_budgets")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("campaign_id", "uuid", (col) =>
      col.references("campaigns.id").onDelete("cascade")
    )
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("limit", "text")
    .addColumn("used", "text")
    .addColumn("attribute", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Campaign budget usages (track attribute-based budget usage)
  await db.schema
    .createTable("campaign_budget_usages")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("campaign_budget_id", "uuid", (col) =>
      col.references("campaign_budgets.id").onDelete("cascade")
    )
    .addColumn("attribute_value", "text")
    .addColumn("used", "text")
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Application methods (how promotion is applied: type, target_type, allocation)
  await db.schema
    .createTable("application_methods")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("target_type", "text", (col) => col.notNull())
    .addColumn("allocation", "text", (col) => col.notNull())
    .addColumn("value", "text")
    .addColumn("max_quantity", "integer")
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

  // Promotions (discount applied to items, shipping, or order)
  await db.schema
    .createTable("promotions")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("code", "text")
    .addColumn("is_automatic", "boolean", (col) => col.notNull().defaultTo(false))
    .addColumn("type", "text", (col) => col.notNull())
    .addColumn("campaign_id", "uuid", (col) =>
      col.references("campaigns.id").onDelete("set null")
    )
    .addColumn("application_method_id", "uuid", (col) =>
      col.references("application_methods.id").onDelete("set null")
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

  // Promotion rules (qualification rules on Promotion; target/buy rules on ApplicationMethod)
  await db.schema
    .createTable("promotion_rules")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("promotion_id", "uuid", (col) =>
      col.references("promotions.id").onDelete("cascade")
    )
    .addColumn("application_method_id", "uuid", (col) =>
      col.references("application_methods.id").onDelete("cascade")
    )
    .addColumn("rule_type", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Promotion rule values
  await db.schema
    .createTable("promotion_rule_values")
    .addColumn("id", "uuid", (col) =>
      col.primaryKey().defaultTo(sql`gen_random_uuid()`)
    )
    .addColumn("promotion_rule_id", "uuid", (col) =>
      col.references("promotion_rules.id").onDelete("cascade")
    )
    .addColumn("value", "text", (col) => col.notNull())
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
  await db.schema.dropTable("promotion_rule_values").execute();
  await db.schema.dropTable("promotion_rules").execute();
  await db.schema.dropTable("promotions").execute();
  await db.schema.dropTable("application_methods").execute();
  await db.schema.dropTable("campaign_budget_usages").execute();
  await db.schema.dropTable("campaign_budgets").execute();
  await db.schema.dropTable("campaigns").execute();
}
