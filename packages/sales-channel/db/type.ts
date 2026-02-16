import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  sales_channels: SalesChannelTable;
  product_sales_channels: ProductSalesChannelTable;
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

// table product_sales_channels
export interface ProductSalesChannelTable {
  id: Generated<string>;
  product_id: string;
  sales_channel_id: string;
  created_at: Generated<string>;
}
export type ProductSalesChannel = Selectable<ProductSalesChannelTable>;
export type NewProductSalesChannel = Insertable<ProductSalesChannelTable>;
export type ProductSalesChannelUpdate = Updateable<ProductSalesChannelTable>;
