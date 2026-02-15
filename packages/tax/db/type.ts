import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  tax_providers: TaxProviderTable;
  tax_regions: TaxRegionTable;
  tax_rates: TaxRateTable;
  tax_rate_rules: TaxRateRuleTable;
}

// table tax_providers
export interface TaxProviderTable {
  id: Generated<string>;
  name: string;
  is_installed: boolean;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type TaxProvider = Selectable<TaxProviderTable>;
export type NewTaxProvider = Insertable<TaxProviderTable>;
export type TaxProviderUpdate = Updateable<TaxProviderTable>;

// table tax_regions
export interface TaxRegionTable {
  id: Generated<string>;
  name: string;
  tax_provider_id: string | null;
  parent_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type TaxRegion = Selectable<TaxRegionTable>;
export type NewTaxRegion = Insertable<TaxRegionTable>;
export type TaxRegionUpdate = Updateable<TaxRegionTable>;

// table tax_rates
export interface TaxRateTable {
  id: Generated<string>;
  tax_region_id: string;
  name: string;
  code: string | null;
  rate: string; // Decimal as string for precision (e.g., "10.5" for 10.5%)
  is_combinable: boolean;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type TaxRate = Selectable<TaxRateTable>;
export type NewTaxRate = Insertable<TaxRateTable>;
export type TaxRateUpdate = Updateable<TaxRateTable>;

// table tax_rate_rules
export interface TaxRateRuleTable {
  id: Generated<string>;
  tax_rate_id: string;
  rule_type: string; // e.g., "product_type", "product_id", "product_tag", "shipping_option"
  value: string; // The value for the rule (e.g., product type ID, product ID, tag ID)
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type TaxRateRule = Selectable<TaxRateRuleTable>;
export type NewTaxRateRule = Insertable<TaxRateRuleTable>;
export type TaxRateRuleUpdate = Updateable<TaxRateRuleTable>;
