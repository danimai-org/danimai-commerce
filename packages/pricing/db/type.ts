import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  price_sets: PriceSetTable;
  prices: PriceTable;
  price_lists: PriceListTable;
  price_rules: PriceRuleTable;
  price_list_rules: PriceListRuleTable;
  price_preferences: PricePreferenceTable;
}

// table price_sets
export interface PriceSetTable {
  id: Generated<string>;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PriceSet = Selectable<PriceSetTable>;
export type NewPriceSet = Insertable<PriceSetTable>;
export type PriceSetUpdate = Updateable<PriceSetTable>;

// table prices
export interface PriceTable {
  id: Generated<string>;
  price_set_id: string;
  amount: string; // Decimal as string for precision
  currency_code: string;
  min_quantity: number | null;
  max_quantity: number | null;
  price_list_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Price = Selectable<PriceTable>;
export type NewPrice = Insertable<PriceTable>;
export type PriceUpdate = Updateable<PriceTable>;

// table price_lists
export interface PriceListTable {
  id: Generated<string>;
  name: string;
  description: string | null;
  type: "sale" | "override";
  status: "active" | "draft";
  starts_at: string | null; // ISO timestamp
  ends_at: string | null; // ISO timestamp
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PriceList = Selectable<PriceListTable>;
export type NewPriceList = Insertable<PriceListTable>;
export type PriceListUpdate = Updateable<PriceListTable>;

// table price_rules
export interface PriceRuleTable {
  id: Generated<string>;
  price_id: string;
  rule_type: string; // e.g., "customer_group", "region", "currency"
  value: string; // The value for the rule (e.g., customer group ID, region ID, currency code)
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PriceRule = Selectable<PriceRuleTable>;
export type NewPriceRule = Insertable<PriceRuleTable>;
export type PriceRuleUpdate = Updateable<PriceRuleTable>;

// table price_list_rules
export interface PriceListRuleTable {
  id: Generated<string>;
  price_list_id: string;
  rule_type: string; // e.g., "customer_group", "region", "currency"
  value: string; // The value for the rule (e.g., customer group ID, region ID, currency code)
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PriceListRule = Selectable<PriceListRuleTable>;
export type NewPriceListRule = Insertable<PriceListRuleTable>;
export type PriceListRuleUpdate = Updateable<PriceListRuleTable>;

// table price_preferences
export interface PricePreferenceTable {
  id: Generated<string>;
  price_set_id: string;
  currency_code: string | null;
  region_id: string | null;
  customer_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PricePreference = Selectable<PricePreferenceTable>;
export type NewPricePreference = Insertable<PricePreferenceTable>;
export type PricePreferenceUpdate = Updateable<PricePreferenceTable>;
