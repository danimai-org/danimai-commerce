import type { Generated, Selectable, Insertable, Updateable } from "kysely";

type OrderStatus =
  | "pending"
  | "completed"
  | "archived"
  | "canceled"
  | "requires_action";

type OrderFulfillmentStatus =
  | "not_fulfilled"
  | "partially_fulfilled"
  | "fulfilled"
  | "partially_shipped"
  | "shipped"
  | "partially_returned"
  | "returned"
  | "canceled"
  | "requires_action";

type OrderPaymentStatus =
  | "not_paid"
  | "awaiting"
  | "captured"
  | "partially_refunded"
  | "refunded"
  | "canceled"
  | "requires_action";

type ReturnStatus = "requested" | "received" | "requires_action" | "canceled";

export interface Database {
  orders: OrderTable;
  order_addresses: OrderAddressTable;
  order_items: OrderItemTable;
  order_line_items: OrderLineItemTable;
  order_line_item_adjustments: OrderLineItemAdjustmentTable;
  order_line_item_tax_lines: OrderLineItemTaxLineTable;
  order_shipping: OrderShippingTable;
  order_shipping_methods: OrderShippingMethodTable;
  order_shipping_method_adjustments: OrderShippingMethodAdjustmentTable;
  order_shipping_method_tax_lines: OrderShippingMethodTaxLineTable;
  order_transactions: OrderTransactionTable;
  returns: ReturnTable;
  return_items: ReturnItemTable;
  return_reasons: ReturnReasonTable;
}

// table orders
export interface OrderTable {
  id: Generated<string>;
  status: OrderStatus;
  fulfillment_status: OrderFulfillmentStatus;
  payment_status: OrderPaymentStatus;
  display_id: number; // Sequential order number for display
  currency_code: string;
  email: string | null;
  customer_id: string | null;
  sales_channel_id: string | null;
  region_id: string | null;
  billing_address_id: string | null;
  shipping_address_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Order = Selectable<OrderTable>;
export type NewOrder = Insertable<OrderTable>;
export type OrderUpdate = Updateable<OrderTable>;

// table order_addresses
export interface OrderAddressTable {
  id: Generated<string>;
  first_name: string;
  last_name: string;
  phone: string | null;
  company: string | null;
  address_1: string;
  address_2: string | null;
  city: string;
  country_code: string;
  province: string | null;
  postal_code: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderAddress = Selectable<OrderAddressTable>;
export type NewOrderAddress = Insertable<OrderAddressTable>;
export type OrderAddressUpdate = Updateable<OrderAddressTable>;

// table order_items
export interface OrderItemTable {
  id: Generated<string>;
  order_id: string;
  title: string;
  subtitle: string | null;
  thumbnail: string | null;
  variant_id: string | null;
  product_id: string | null;
  product_title: string | null;
  product_description: string | null;
  product_subtitle: string | null;
  product_type: string | null;
  product_collection: string | null;
  product_handle: string | null;
  variant_sku: string | null;
  variant_barcode: string | null;
  variant_title: string | null;
  variant_option_values: unknown | null; // JSON array of option values
  requires_shipping: boolean;
  is_discountable: boolean;
  is_tax_inclusive: boolean;
  compare_at_unit_price: string | null; // Decimal as string
  unit_price: string; // Decimal as string
  quantity: number;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderItem = Selectable<OrderItemTable>;
export type NewOrderItem = Insertable<OrderItemTable>;
export type OrderItemUpdate = Updateable<OrderItemTable>;

// table order_line_items
export interface OrderLineItemTable {
  id: Generated<string>;
  order_id: string;
  title: string;
  description: string | null;
  subtitle: string | null;
  thumbnail: string | null;
  variant_id: string | null;
  product_id: string | null;
  product_title: string | null;
  product_description: string | null;
  product_subtitle: string | null;
  product_type: string | null;
  product_collection: string | null;
  product_handle: string | null;
  variant_sku: string | null;
  variant_barcode: string | null;
  variant_title: string | null;
  variant_option_values: unknown | null; // JSON array of option values
  requires_shipping: boolean;
  is_discountable: boolean;
  is_tax_inclusive: boolean;
  compare_at_unit_price: string | null; // Decimal as string
  unit_price: string; // Decimal as string
  quantity: number;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderLineItem = Selectable<OrderLineItemTable>;
export type NewOrderLineItem = Insertable<OrderLineItemTable>;
export type OrderLineItemUpdate = Updateable<OrderLineItemTable>;

// table order_line_item_adjustments
export interface OrderLineItemAdjustmentTable {
  id: Generated<string>;
  order_line_item_id: string;
  code: string | null;
  amount: string; // Decimal as string
  description: string | null;
  promotion_id: string | null;
  provider_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderLineItemAdjustment = Selectable<OrderLineItemAdjustmentTable>;
export type NewOrderLineItemAdjustment = Insertable<OrderLineItemAdjustmentTable>;
export type OrderLineItemAdjustmentUpdate = Updateable<OrderLineItemAdjustmentTable>;

// table order_line_item_tax_lines
export interface OrderLineItemTaxLineTable {
  id: Generated<string>;
  order_line_item_id: string;
  description: string | null;
  tax_rate_id: string | null;
  code: string | null;
  rate: string; // Decimal as string (e.g., "10.5" for 10.5%)
  provider_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderLineItemTaxLine = Selectable<OrderLineItemTaxLineTable>;
export type NewOrderLineItemTaxLine = Insertable<OrderLineItemTaxLineTable>;
export type OrderLineItemTaxLineUpdate = Updateable<OrderLineItemTaxLineTable>;

// table order_shipping
export interface OrderShippingTable {
  id: Generated<string>;
  order_id: string;
  name: string | null;
  amount: string; // Decimal as string
  data: unknown | null; // JSON for shipping provider data
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderShipping = Selectable<OrderShippingTable>;
export type NewOrderShipping = Insertable<OrderShippingTable>;
export type OrderShippingUpdate = Updateable<OrderShippingTable>;

// table order_shipping_methods
export interface OrderShippingMethodTable {
  id: Generated<string>;
  order_id: string;
  name: string;
  shipping_option_id: string | null;
  amount: string; // Decimal as string
  data: unknown | null; // JSON for shipping provider data
  tax_lines: unknown | null; // JSON array of tax lines
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderShippingMethod = Selectable<OrderShippingMethodTable>;
export type NewOrderShippingMethod = Insertable<OrderShippingMethodTable>;
export type OrderShippingMethodUpdate = Updateable<OrderShippingMethodTable>;

// table order_shipping_method_adjustments
export interface OrderShippingMethodAdjustmentTable {
  id: Generated<string>;
  order_shipping_method_id: string;
  code: string | null;
  amount: string; // Decimal as string
  description: string | null;
  promotion_id: string | null;
  provider_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderShippingMethodAdjustment = Selectable<OrderShippingMethodAdjustmentTable>;
export type NewOrderShippingMethodAdjustment = Insertable<OrderShippingMethodAdjustmentTable>;
export type OrderShippingMethodAdjustmentUpdate = Updateable<OrderShippingMethodAdjustmentTable>;

// table order_shipping_method_tax_lines
export interface OrderShippingMethodTaxLineTable {
  id: Generated<string>;
  order_shipping_method_id: string;
  description: string | null;
  tax_rate_id: string | null;
  code: string | null;
  rate: string; // Decimal as string (e.g., "10.5" for 10.5%)
  provider_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderShippingMethodTaxLine = Selectable<OrderShippingMethodTaxLineTable>;
export type NewOrderShippingMethodTaxLine = Insertable<OrderShippingMethodTaxLineTable>;
export type OrderShippingMethodTaxLineUpdate = Updateable<OrderShippingMethodTaxLineTable>;

// table order_transactions
export interface OrderTransactionTable {
  id: Generated<string>;
  order_id: string;
  amount: string; // Decimal as string
  currency_code: string;
  reference: string | null;
  reference_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type OrderTransaction = Selectable<OrderTransactionTable>;
export type NewOrderTransaction = Insertable<OrderTransactionTable>;
export type OrderTransactionUpdate = Updateable<OrderTransactionTable>;

// table returns
export interface ReturnTable {
  id: Generated<string>;
  order_id: string;
  status: ReturnStatus;
  shipping_data: unknown | null; // JSON for shipping data
  refund_amount: string | null; // Decimal as string
  location_id: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Return = Selectable<ReturnTable>;
export type NewReturn = Insertable<ReturnTable>;
export type ReturnUpdate = Updateable<ReturnTable>;

// table return_items
export interface ReturnItemTable {
  id: Generated<string>;
  return_id: string;
  order_item_id: string;
  quantity: number;
  reason_id: string | null;
  note: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ReturnItem = Selectable<ReturnItemTable>;
export type NewReturnItem = Insertable<ReturnItemTable>;
export type ReturnItemUpdate = Updateable<ReturnItemTable>;

// table return_reasons
export interface ReturnReasonTable {
  id: Generated<string>;
  label: string;
  description: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type ReturnReason = Selectable<ReturnReasonTable>;
export type NewReturnReason = Insertable<ReturnReasonTable>;
export type ReturnReasonUpdate = Updateable<ReturnReasonTable>;
