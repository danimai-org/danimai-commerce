import type { Generated, Selectable, Insertable, Updateable } from "kysely";

/**
 * Stock Location module data types based on Danimai Stock Location Next Module.
 */

export interface Database {
  stock_locations: StockLocationTable;
  stock_location_addresses: StockLocationAddressTable;
}

// table stock_locations (physical location where stock items are kept, e.g. warehouse)
export interface StockLocationTable {
  id: Generated<string>;
  name: string | null;
  address_id: string | null; // Foreign key to stock_location_addresses
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type StockLocation = Selectable<StockLocationTable>;
export type NewStockLocation = Insertable<StockLocationTable>;
export type StockLocationUpdate = Updateable<StockLocationTable>;

// table stock_location_addresses (address details of a stock location)
export interface StockLocationAddressTable {
  id: Generated<string>;
  stock_location_id: string | null; // Foreign key to stock_locations
  address_1: string | null;
  address_2: string | null;
  company: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  country_code: string | null;
  phone: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type StockLocationAddress = Selectable<StockLocationAddressTable>;
export type NewStockLocationAddress = Insertable<StockLocationAddressTable>;
export type StockLocationAddressUpdate = Updateable<StockLocationAddressTable>;
