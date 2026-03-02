import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  stores: StoreTable;
}

export interface StoreTable {
  id: Generated<string>;
  name: string;
  default_currency_code: string | null;
  default_sales_channel_id: string | null;
  default_region_id: string | null;
  default_location_id: string | null;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}

export type Store = Selectable<StoreTable>;
export type NewStore = Insertable<StoreTable>;
export type StoreUpdate = Updateable<StoreTable>;
