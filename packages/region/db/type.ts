import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  regions: RegionTable;
  countries: CountryTable;
}

// table regions
export interface RegionTable {
  id: Generated<string>;
  name: string;
  currency_code: string; // Three-character currency code (e.g., "USD", "EUR")
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Region = Selectable<RegionTable>;
export type NewRegion = Insertable<RegionTable>;
export type RegionUpdate = Updateable<RegionTable>;

// table countries
export interface CountryTable {
  id: Generated<string>;
  iso_2: string; // Two-character ISO code (e.g., "us", "gb")
  iso_3: string; // Three-character ISO code (e.g., "usa", "gbr")
  num_code: number; // Numerical ISO code
  name: string; // Normalized country name in uppercase
  display_name: string; // Country name for display
  region_id: string | null; // Foreign key to regions
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Country = Selectable<CountryTable>;
export type NewCountry = Insertable<CountryTable>;
export type CountryUpdate = Updateable<CountryTable>;
