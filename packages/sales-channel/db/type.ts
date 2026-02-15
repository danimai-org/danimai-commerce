import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  sales_channels: SalesChannelTable;
}

// table sales_channels
export interface SalesChannelTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  is_default: boolean;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type SalesChannel = Selectable<SalesChannelTable>;
export type NewSalesChannel = Insertable<SalesChannelTable>;
export type SalesChannelUpdate = Updateable<SalesChannelTable>;
