import type { Generated, Selectable, Insertable, Updateable } from "kysely";

/**
 * Cart module data types based on Danimai Cart Module.
 */

export interface Database {
  carts: CartTable;
  cart_addresses: CartAddressTable;
  cart_line_items: CartLineItemTable;
  cart_line_item_adjustments: CartLineItemAdjustmentTable;
  cart_line_item_tax_lines: CartLineItemTaxLineTable;
  cart_credit_lines: CartCreditLineTable;
  cart_shipping_methods: CartShippingMethodTable;
  cart_shipping_method_tax_lines: CartShippingMethodTaxLineTable;
  cart_shipping_method_adjustments: CartShippingMethodAdjustmentTable;
}

// table carts
export interface CartTable {
  id: Generated<string>;
  email: string | null;
  currency_code: string | null;
  region_id: string | null;
  customer_id: string | null;
  type: string | null; // "default" | "swap" | "draft_order" | "payment_link" | "claim"
  completed_at: string | null; // ISO timestamp
  payment_authorized_at: string | null; // ISO timestamp
  shipping_address_id: string | null; // Foreign key to cart_addresses
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Cart = Selectable<CartTable>;
export type NewCart = Insertable<CartTable>;
export type CartUpdate = Updateable<CartTable>;

// table cart_addresses
export interface CartAddressTable {
  id: Generated<string>;
  cart_id: string | null; // Foreign key to carts
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
export type CartAddress = Selectable<CartAddressTable>;
export type NewCartAddress = Insertable<CartAddressTable>;
export type CartAddressUpdate = Updateable<CartAddressTable>;

// table cart_line_items
export interface CartLineItemTable {
  id: Generated<string>;
  cart_id: string | null; // Foreign key to carts
  title: string | null;
  description: string | null;
  thumbnail: string | null;
  variant_id: string | null; // Reference to product variant
  product_id: string | null; // Reference to product
  quantity: number | null;
  unit_price: string | null; // Decimal as string
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartLineItem = Selectable<CartLineItemTable>;
export type NewCartLineItem = Insertable<CartLineItemTable>;
export type CartLineItemUpdate = Updateable<CartLineItemTable>;

// table cart_line_item_adjustments
export interface CartLineItemAdjustmentTable {
  id: Generated<string>;
  line_item_id: string | null; // Foreign key to cart_line_items
  code: string | null; // Adjustment code (e.g., promotion code)
  amount: string | null; // Decimal as string
  description: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartLineItemAdjustment = Selectable<CartLineItemAdjustmentTable>;
export type NewCartLineItemAdjustment = Insertable<CartLineItemAdjustmentTable>;
export type CartLineItemAdjustmentUpdate = Updateable<CartLineItemAdjustmentTable>;

// table cart_line_item_tax_lines
export interface CartLineItemTaxLineTable {
  id: Generated<string>;
  line_item_id: string | null; // Foreign key to cart_line_items
  description: string | null;
  code: string | null; // Tax code
  rate: string | null; // Tax rate as decimal string
  provider_id: string | null; // Tax provider ID
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartLineItemTaxLine = Selectable<CartLineItemTaxLineTable>;
export type NewCartLineItemTaxLine = Insertable<CartLineItemTaxLineTable>;
export type CartLineItemTaxLineUpdate = Updateable<CartLineItemTaxLineTable>;

// table cart_credit_lines
export interface CartCreditLineTable {
  id: Generated<string>;
  cart_id: string | null; // Foreign key to carts
  code: string | null; // Credit code
  amount: string | null; // Decimal as string
  description: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartCreditLine = Selectable<CartCreditLineTable>;
export type NewCartCreditLine = Insertable<CartCreditLineTable>;
export type CartCreditLineUpdate = Updateable<CartCreditLineTable>;

// table cart_shipping_methods
export interface CartShippingMethodTable {
  id: Generated<string>;
  cart_id: string | null; // Foreign key to carts
  name: string | null;
  shipping_option_id: string | null; // Reference to shipping option
  amount: string | null; // Decimal as string
  data: unknown | null; // Custom shipping method data
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartShippingMethod = Selectable<CartShippingMethodTable>;
export type NewCartShippingMethod = Insertable<CartShippingMethodTable>;
export type CartShippingMethodUpdate = Updateable<CartShippingMethodTable>;

// table cart_shipping_method_tax_lines
export interface CartShippingMethodTaxLineTable {
  id: Generated<string>;
  shipping_method_id: string | null; // Foreign key to cart_shipping_methods
  description: string | null;
  code: string | null; // Tax code
  rate: string | null; // Tax rate as decimal string
  provider_id: string | null; // Tax provider ID
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartShippingMethodTaxLine = Selectable<CartShippingMethodTaxLineTable>;
export type NewCartShippingMethodTaxLine = Insertable<CartShippingMethodTaxLineTable>;
export type CartShippingMethodTaxLineUpdate = Updateable<CartShippingMethodTaxLineTable>;

// table cart_shipping_method_adjustments
export interface CartShippingMethodAdjustmentTable {
  id: Generated<string>;
  shipping_method_id: string | null; // Foreign key to cart_shipping_methods
  code: string | null; // Adjustment code
  amount: string | null; // Decimal as string
  description: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CartShippingMethodAdjustment = Selectable<CartShippingMethodAdjustmentTable>;
export type NewCartShippingMethodAdjustment = Insertable<CartShippingMethodAdjustmentTable>;
export type CartShippingMethodAdjustmentUpdate = Updateable<CartShippingMethodAdjustmentTable>;
