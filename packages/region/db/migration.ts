import { Country } from "country-state-city";
import { alpha2ToAlpha3, alpha2ToNumeric } from "i18n-iso-countries";
import { Kysely, sql } from "kysely";

function seedCountryRows() {
  return Country.getAllCountries().map((c) => {
    const iso3 = alpha2ToAlpha3(c.isoCode);
    const numStr = alpha2ToNumeric(c.isoCode);
    if (!iso3 || !numStr) {
      throw new Error(`Missing ISO 3166-1 alpha-3 / numeric for ${c.isoCode}`);
    }
    return {
      iso_2: c.isoCode.toLowerCase(),
      iso_3: iso3.toLowerCase(),
      num_code: parseInt(numStr, 10),
      name: c.name.toUpperCase(),
      display_name: c.name,
      region_id: null,
      metadata: null,
    };
  });
}

export async function up(db: Kysely<any>) {
  // Regions
  await db.schema
    .createTable("regions")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("currency_code", "text", (col) => col.notNull())
    .addColumn("metadata", "jsonb")
    .addColumn("created_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("updated_at", "timestamptz", (col) =>
      col.notNull().defaultTo(sql`now()`)
    )
    .addColumn("deleted_at", "timestamptz")
    .execute();

  // Countries (must be created after regions)
  await db.schema
    .createTable("countries")
    .addColumn("id", "uuid", (col) => col.primaryKey().defaultTo(sql`gen_random_uuid()`))
    .addColumn("iso_2", "text", (col) => col.notNull().unique())
    .addColumn("iso_3", "text", (col) => col.notNull().unique())
    .addColumn("num_code", "integer", (col) => col.notNull().unique())
    .addColumn("name", "text", (col) => col.notNull())
    .addColumn("display_name", "text", (col) => col.notNull())
    .addColumn("region_id", "uuid", (col) =>
      col.references("regions.id").onDelete("set null")
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

  await db.insertInto("countries").values(seedCountryRows()).execute();
}

export async function down(db: Kysely<any>) {
  await db.schema.dropTable("countries").execute();
  await db.schema.dropTable("regions").execute();
}
