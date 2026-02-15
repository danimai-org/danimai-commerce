import type { Generated, Selectable, Insertable, Updateable } from "kysely";

/**
 * Payment module data types based on Danimai Payment Module.
 */

export interface Database {
  account_holders: AccountHolderTable;
  payment_providers: PaymentProviderTable;
  refund_reasons: RefundReasonTable;
  payment_collections: PaymentCollectionTable;
  payment_collection_providers: PaymentCollectionProviderTable;
  payment_sessions: PaymentSessionTable;
  payments: PaymentTable;
  captures: CaptureTable;
  refunds: RefundTable;
}

// table account_holders (customer/account context for payment)
export interface AccountHolderTable {
  id: Generated<string>;
  type: string | null; // e.g. "customer"
  account_id: string | null; // e.g. customer id
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type AccountHolder = Selectable<AccountHolderTable>;
export type NewAccountHolder = Insertable<AccountHolderTable>;
export type AccountHolderUpdate = Updateable<AccountHolderTable>;

// table payment_providers (e.g. stripe, manual)
export interface PaymentProviderTable {
  id: Generated<string>;
  name: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PaymentProvider = Selectable<PaymentProviderTable>;
export type NewPaymentProvider = Insertable<PaymentProviderTable>;
export type PaymentProviderUpdate = Updateable<PaymentProviderTable>;

// table refund_reasons (e.g. duplicate, fraud, requested)
export interface RefundReasonTable {
  id: Generated<string>;
  label: string | null;
  value: string | null; // code
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type RefundReason = Selectable<RefundReasonTable>;
export type NewRefundReason = Insertable<RefundReasonTable>;
export type RefundReasonUpdate = Updateable<RefundReasonTable>;

// table payment_collections (groups payment sessions and payments)
export interface PaymentCollectionTable {
  id: Generated<string>;
  amount: string | null; // total as decimal string
  currency_code: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PaymentCollection = Selectable<PaymentCollectionTable>;
export type NewPaymentCollection = Insertable<PaymentCollectionTable>;
export type PaymentCollectionUpdate = Updateable<PaymentCollectionTable>;

// M:N join: payment_collections <-> payment_providers
export interface PaymentCollectionProviderTable {
  payment_collection_id: string;
  payment_provider_id: string;
  created_at: Generated<string>;
}
export type PaymentCollectionProvider = Selectable<PaymentCollectionProviderTable>;
export type NewPaymentCollectionProvider = Insertable<PaymentCollectionProviderTable>;
export type PaymentCollectionProviderUpdate = Updateable<PaymentCollectionProviderTable>;

// table payment_sessions (amount to authorize, provider-specific data)
export interface PaymentSessionTable {
  id: Generated<string>;
  payment_collection_id: string | null;
  provider_id: string | null;
  amount: string | null; // decimal as string
  currency_code: string | null;
  data: unknown | null; // provider-specific payload
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type PaymentSession = Selectable<PaymentSessionTable>;
export type NewPaymentSession = Insertable<PaymentSessionTable>;
export type PaymentSessionUpdate = Updateable<PaymentSessionTable>;

// table payments (created when session authorized; has captures, refunds)
export interface PaymentTable {
  id: Generated<string>;
  payment_collection_id: string | null;
  payment_session_id: string | null;
  provider_id: string | null;
  amount: string | null; // decimal as string
  currency_code: string | null;
  data: unknown | null; // from session, for provider processing
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Payment = Selectable<PaymentTable>;
export type NewPayment = Insertable<PaymentTable>;
export type PaymentUpdate = Updateable<PaymentTable>;

// table captures (incremental capture of authorized payment)
export interface CaptureTable {
  id: Generated<string>;
  payment_id: string | null;
  amount: string | null; // decimal as string
  created_by: string | null; // e.g. user id
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Capture = Selectable<CaptureTable>;
export type NewCapture = Insertable<CaptureTable>;
export type CaptureUpdate = Updateable<CaptureTable>;

// table refunds (refund of captured amount)
export interface RefundTable {
  id: Generated<string>;
  payment_id: string | null;
  amount: string | null; // decimal as string
  refund_reason_id: string | null;
  created_by: string | null;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Refund = Selectable<RefundTable>;
export type NewRefund = Insertable<RefundTable>;
export type RefundUpdate = Updateable<RefundTable>;
