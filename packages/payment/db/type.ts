import type {
  ColumnType,
  Generated,
  Selectable,
  Insertable,
  Updateable,
} from "kysely";
import type { CustomerTable } from "../../customer/db/type";
import type { OrderLineItemTable, OrderTable } from "@danimai/order";

/** PostgreSQL numeric; string at runtime for precision. */
export type Decimal = ColumnType<string, string | number, string>;

/**
 * Payment module data types based on Danimai Payment Module.
 */

export type PaymentStatus = "pending" | "failed" | "succeeded" | "cancelled";

export type PaymentCustomerStatus = "active" | "cancelled";

export interface Database {
  customers: CustomerTable;
  orders: OrderTable;
  order_line_items: OrderLineItemTable;
  payment_providers: PaymentProviderTable;
  refund_reasons: RefundReasonTable;
  payment_customers: PaymentCustomerTable;
  payments: PaymentTable;
  payment_transactions: PaymentTransactionTable;
  refunds: RefundTable;
}

// table payment_providers (e.g. stripe, razorpay, paypal)
export interface PaymentProviderTable {
  id: Generated<string>;
  name: string;
  metadata: Record<string, any> | null;
  active: boolean;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type PaymentProvider = Selectable<PaymentProviderTable>;
export type NewPaymentProvider = Insertable<PaymentProviderTable>;
export type PaymentProviderUpdate = Updateable<PaymentProviderTable>;

// table refund_reasons (e.g. duplicate, fraud, requested)
export interface RefundReasonTable {
  id: Generated<string>;
  label: string;
  value: string; // code
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type RefundReason = Selectable<RefundReasonTable>;
export type NewRefundReason = Insertable<RefundReasonTable>;
export type RefundReasonUpdate = Updateable<RefundReasonTable>;

// table payment_customers (third-party customer sync per provider)
export interface PaymentCustomerTable {
  id: Generated<string>;
  customer_id: string;
  stripe_customer_id: string; // e.g. Stripe customer id
  provider_id: string;
  metadata: unknown | null;
  status: Generated<PaymentCustomerStatus>; // defaults to active
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type PaymentCustomer = Selectable<PaymentCustomerTable>;
export type NewPaymentCustomer = Insertable<PaymentCustomerTable>;
export type PaymentCustomerUpdate = Updateable<PaymentCustomerTable>;

// table payments
export interface PaymentTable {
  id: Generated<string>;
  order_id: string;
  customer_id: string;
  provider_id: string;
  amount: Decimal;
  currency_code: string;
  last_status: Generated<PaymentStatus>; // defaults to pending
  last_transaction_id: string | null;
  success_transaction_id: string | null;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type Payment = Selectable<PaymentTable>;
export type NewPayment = Insertable<PaymentTable>;
export type PaymentUpdate = Updateable<PaymentTable>;

// table payment_transactions (provider attempt/charge per payment)
export interface PaymentTransactionTable {
  id: Generated<string>;
  payment_id: string;
  provider_id: string;
  amount: Decimal;
  currency_code: string;
  last_status: Generated<PaymentStatus>; // defaults to pending
  metadata: unknown | null; // from stripe, razorpay, paypal
  payment_intent_id: string | null; // e.g. payment intent  from stripe
  checkout_id: string | null; // e.g. checkout id  from stripe
  customer_id: string;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type PaymentTransaction = Selectable<PaymentTransactionTable>;
export type NewPaymentTransaction = Insertable<PaymentTransactionTable>;
export type PaymentTransactionUpdate = Updateable<PaymentTransactionTable>;

// table refunds
export interface RefundTable {
  id: Generated<string>;
  customer_id: string;
  payment_id: string;
  payment_transaction_id: string;
  amount: Decimal;
  refund_reason_id: string | null;
  last_status: Generated<PaymentStatus>; // defaults to pending
  stripe_refund_id: string | null; // e.g from stripe
  created_by: string | null;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type Refund = Selectable<RefundTable>;
export type NewRefund = Insertable<RefundTable>;
export type RefundUpdate = Updateable<RefundTable>;
