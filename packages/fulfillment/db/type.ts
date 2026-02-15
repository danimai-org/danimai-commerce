import type { Generated, Selectable, Insertable, Updateable } from "kysely";

/**
 * Fulfillment module data types based on Danimai Fulfillment Module.
 */

export interface Database {
  fulfillment_sets: FulfillmentSetTable;
  service_zones: ServiceZoneTable;
  geo_zones: GeoZoneTable;
  shipping_profiles: ShippingProfileTable;
  shipping_option_types: ShippingOptionTypeTable;
  shipping_options: ShippingOptionTable;
  shipping_option_rules: ShippingOptionRuleTable;
  fulfillment_providers: FulfillmentProviderTable;
  fulfillment_addresses: FulfillmentAddressTable;
  fulfillments: FulfillmentTable;
  fulfillment_items: FulfillmentItemTable;
  fulfillment_labels: FulfillmentLabelTable;
}

// table fulfillment_sets (e.g. shipping, pick-up)
export interface FulfillmentSetTable {
  id: Generated<string>;
  name: string | null;
  type: string | null; // "shipping" | "pick-up" | etc.
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type FulfillmentSet = Selectable<FulfillmentSetTable>;
export type NewFulfillmentSet = Insertable<FulfillmentSetTable>;
export type FulfillmentSetUpdate = Updateable<FulfillmentSetTable>;

// table service_zones (collection of geo zones, restricts shipping options by location)
export interface ServiceZoneTable {
  id: Generated<string>;
  fulfillment_set_id: string | null;
  name: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ServiceZone = Selectable<ServiceZoneTable>;
export type NewServiceZone = Insertable<ServiceZoneTable>;
export type ServiceZoneUpdate = Updateable<ServiceZoneTable>;

// table geo_zones (country, province, city, postal_expression)
export interface GeoZoneTable {
  id: Generated<string>;
  service_zone_id: string | null;
  type: string | null; // geo zone type
  country_code: string | null;
  province_code: string | null; // ISO 3166-2 lowercase
  city: string | null;
  postal_expression: unknown | null; // JSON e.g. pattern
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type GeoZone = Selectable<GeoZoneTable>;
export type NewGeoZone = Insertable<GeoZoneTable>;
export type GeoZoneUpdate = Updateable<GeoZoneTable>;

// table shipping_profiles (e.g. default, digital - groups items shipped similarly)
export interface ShippingProfileTable {
  id: Generated<string>;
  name: string | null;
  type: string | null; // "default" | "gift_card" | "custom"
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ShippingProfile = Selectable<ShippingProfileTable>;
export type NewShippingProfile = Insertable<ShippingProfileTable>;
export type ShippingProfileUpdate = Updateable<ShippingProfileTable>;

// table shipping_option_types (e.g. express, standard)
export interface ShippingOptionTypeTable {
  id: Generated<string>;
  label: string | null;
  code: string | null;
  description: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ShippingOptionType = Selectable<ShippingOptionTypeTable>;
export type NewShippingOptionType = Insertable<ShippingOptionTypeTable>;
export type ShippingOptionTypeUpdate = Updateable<ShippingOptionTypeTable>;

// table shipping_options (offered by provider, restricted by service zone)
export interface ShippingOptionTable {
  id: Generated<string>;
  name: string | null;
  service_zone_id: string | null;
  shipping_profile_id: string | null;
  shipping_option_type_id: string | null;
  provider_id: string | null; // fulfillment_providers.id
  price_type: string | null; // "flat" | "calculated"
  amount: string | null; // decimal as string
  data: unknown | null; // custom provider data
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ShippingOption = Selectable<ShippingOptionTable>;
export type NewShippingOption = Insertable<ShippingOptionTable>;
export type ShippingOptionUpdate = Updateable<ShippingOptionTable>;

// table shipping_option_rules (attribute, operator, value - e.g. customer_group, weight)
export interface ShippingOptionRuleTable {
  id: Generated<string>;
  shipping_option_id: string | null;
  attribute: string | null; // e.g. "customer_group", "weight"
  operator: string | null; // "in" | "nin" | etc.
  value: unknown | null; // JSON - single or array of values
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ShippingOptionRule = Selectable<ShippingOptionRuleTable>;
export type NewShippingOptionRule = Insertable<ShippingOptionRuleTable>;
export type ShippingOptionRuleUpdate = Updateable<ShippingOptionRuleTable>;

// table fulfillment_providers (e.g. manual, fedex)
export interface FulfillmentProviderTable {
  id: Generated<string>;
  name: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type FulfillmentProvider = Selectable<FulfillmentProviderTable>;
export type NewFulfillmentProvider = Insertable<FulfillmentProviderTable>;
export type FulfillmentProviderUpdate = Updateable<FulfillmentProviderTable>;

// table fulfillment_addresses (delivery address)
export interface FulfillmentAddressTable {
  id: Generated<string>;
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
export type FulfillmentAddress = Selectable<FulfillmentAddressTable>;
export type NewFulfillmentAddress = Insertable<FulfillmentAddressTable>;
export type FulfillmentAddressUpdate = Updateable<FulfillmentAddressTable>;

// table fulfillments (instance of fulfilling items via a shipping option)
export interface FulfillmentTable {
  id: Generated<string>;
  location_id: string | null;
  shipping_option_id: string | null;
  provider_id: string | null;
  delivery_address_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Fulfillment = Selectable<FulfillmentTable>;
export type NewFulfillment = Insertable<FulfillmentTable>;
export type FulfillmentUpdate = Updateable<FulfillmentTable>;

// table fulfillment_items (line items in a fulfillment)
export interface FulfillmentItemTable {
  id: Generated<string>;
  fulfillment_id: string | null;
  item_id: string | null; // line item reference
  quantity: number | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type FulfillmentItem = Selectable<FulfillmentItemTable>;
export type NewFulfillmentItem = Insertable<FulfillmentItemTable>;
export type FulfillmentItemUpdate = Updateable<FulfillmentItemTable>;

// table fulfillment_labels (tracking labels)
export interface FulfillmentLabelTable {
  id: Generated<string>;
  fulfillment_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  label_url: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type FulfillmentLabel = Selectable<FulfillmentLabelTable>;
export type NewFulfillmentLabel = Insertable<FulfillmentLabelTable>;
export type FulfillmentLabelUpdate = Updateable<FulfillmentLabelTable>;
