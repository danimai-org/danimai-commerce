import type { Generated, Selectable, Insertable, Updateable } from "kysely";

/**
 * Promotion module data types based on Danimai Promotion Module.
 */

type PromotionType = "standard" | "buyget";
type ApplicationMethodType = "fixed" | "percentage";
type TargetType = "items" | "shipping_methods" | "order";
type Allocation = "each" | "across" | "once";
type CampaignBudgetType = "spend" | "usage" | "use_by_attribute";

export interface Database {
  promotions: PromotionTable;
  application_methods: ApplicationMethodTable;
  campaigns: CampaignTable;
  campaign_budgets: CampaignBudgetTable;
  campaign_budget_usages: CampaignBudgetUsageTable;
  promotion_rules: PromotionRuleTable;
  promotion_rule_values: PromotionRuleValueTable;
}

// table promotions
export interface PromotionTable {
  id: Generated<string>;
  code: string | null;
  is_automatic: boolean;
  type: PromotionType;
  campaign_id: string | null;
  application_method_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Promotion = Selectable<PromotionTable>;
export type NewPromotion = Insertable<PromotionTable>;
export type PromotionUpdate = Updateable<PromotionTable>;

// table application_methods
export interface ApplicationMethodTable {
  id: Generated<string>;
  type: ApplicationMethodType;
  target_type: TargetType;
  allocation: Allocation;
  value: string | null; // fixed amount or percentage as string
  max_quantity: number | null;
  currency_code: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ApplicationMethod = Selectable<ApplicationMethodTable>;
export type NewApplicationMethod = Insertable<ApplicationMethodTable>;
export type ApplicationMethodUpdate = Updateable<ApplicationMethodTable>;

// table campaigns
export interface CampaignTable {
  id: Generated<string>;
  name: string | null;
  description: string | null;
  campaign_identifier: string | null;
  starts_at: string | null;
  ends_at: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Campaign = Selectable<CampaignTable>;
export type NewCampaign = Insertable<CampaignTable>;
export type CampaignUpdate = Updateable<CampaignTable>;

// table campaign_budgets
export interface CampaignBudgetTable {
  id: Generated<string>;
  campaign_id: string | null;
  type: CampaignBudgetType;
  limit: string | null; // amount or count as string
  used: string | null; // amount spent or usage count
  attribute: string | null; // e.g. "customer_id", "customer_email" for use_by_attribute
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CampaignBudget = Selectable<CampaignBudgetTable>;
export type NewCampaignBudget = Insertable<CampaignBudgetTable>;
export type CampaignBudgetUpdate = Updateable<CampaignBudgetTable>;

// table campaign_budget_usages
export interface CampaignBudgetUsageTable {
  id: Generated<string>;
  campaign_budget_id: string | null;
  attribute_value: string | null; // e.g. customer_id or email
  used: string | null; // usage count for this attribute value
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CampaignBudgetUsage = Selectable<CampaignBudgetUsageTable>;
export type NewCampaignBudgetUsage = Insertable<CampaignBudgetUsageTable>;
export type CampaignBudgetUsageUpdate = Updateable<CampaignBudgetUsageTable>;

// table promotion_rules (qualification rules on Promotion; target_rules/buy_rules on ApplicationMethod)
export interface PromotionRuleTable {
  id: Generated<string>;
  promotion_id: string | null;
  application_method_id: string | null;
  rule_type: string; // e.g. "customer_group", "items", "sku"
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PromotionRule = Selectable<PromotionRuleTable>;
export type NewPromotionRule = Insertable<PromotionRuleTable>;
export type PromotionRuleUpdate = Updateable<PromotionRuleTable>;

// table promotion_rule_values
export interface PromotionRuleValueTable {
  id: Generated<string>;
  promotion_rule_id: string | null;
  value: string; // e.g. customer group id, sku, product ids
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PromotionRuleValue = Selectable<PromotionRuleValueTable>;
export type NewPromotionRuleValue = Insertable<PromotionRuleValueTable>;
export type PromotionRuleValueUpdate = Updateable<PromotionRuleValueTable>;
