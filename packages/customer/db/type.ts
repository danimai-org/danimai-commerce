import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export const CUSTOMER_TOKEN_TYPES = {
  SIGNUP_VERIFY: "SIGNUP_VERIFY",
  RESET_PASSWORD: "RESET_PASSWORD",
} as const;

export type CustomerTokenType =
  (typeof CUSTOMER_TOKEN_TYPES)[keyof typeof CUSTOMER_TOKEN_TYPES];

export interface Database {
  customers: CustomerTable;
  customer_addresses: CustomerAddressTable;
  customer_groups: CustomerGroupTable;
  customer_group_customers: CustomerGroupCustomerTable;
  customer_sessions: CustomerSessionTable;
  customer_tokens: CustomerTokenTable;
  auth_providers: AuthProviderTable;
}

// table customers
export interface CustomerTable {
  id: Generated<string>;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
  active: boolean;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type Customer = Selectable<CustomerTable>;
export type NewCustomer = Insertable<CustomerTable>;
export type CustomerUpdate = Updateable<CustomerTable>;

// table customer_sessions — tracks each customer session; filter by expires_at for automatic expiry
export interface CustomerSessionTable {
  id: Generated<string>;
  customer_id: string | null;
  parent_id: string | null;
  refresh_token_hash: string | null;
  ip_address: string | null;
  user_agent: string | null;
  expires_at: string;
  logged_out_at: string | null;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type CustomerSession = Selectable<CustomerSessionTable>;
export type NewCustomerSession = Insertable<CustomerSessionTable>;
export type CustomerSessionUpdate = Updateable<CustomerSessionTable>;

// table customer_tokens — one-time verification / reset secrets (store hash only)
export interface CustomerTokenTable {
  id: Generated<string>;
  customer_id: string;
  token_hash: string;
  type: CustomerTokenType;
  expires_at: string;
  used_at: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type CustomerToken = Selectable<CustomerTokenTable>;
export type NewCustomerToken = Insertable<CustomerTokenTable>;
export type CustomerTokenUpdate = Updateable<CustomerTokenTable>;

// table auth_providers — credentials per provider (password, oauth, etc.)
export interface AuthProviderTable {
  id: Generated<string>;
  customer_id: string;
  provider_type: string;
  provider_name: string;
  provider_account_id: string;
  password_hash: string | null;
  access_token: string | null;
  refresh_token: string | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

export type AuthProvider = Selectable<AuthProviderTable>;
export type NewAuthProvider = Insertable<AuthProviderTable>;
export type AuthProviderUpdate = Updateable<AuthProviderTable>;

// table customer_addresses
export interface CustomerAddressTable {
  id: Generated<string>;
  customer_id: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  company: string | null;
  address_1: string;
  address_2: string | null;
  city: string;
  country_code: string;
  province: string | null;
  postal_code: string | null;
  is_default: boolean;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type CustomerAddress = Selectable<CustomerAddressTable>;
export type NewCustomerAddress = Insertable<CustomerAddressTable>;
export type CustomerAddressUpdate = Updateable<CustomerAddressTable>;

// table customer_groups
export interface CustomerGroupTable {
  id: Generated<string>;
  name: string;
  metadata: unknown | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  deleted_at: Date | null;
}
export type CustomerGroup = Selectable<CustomerGroupTable>;
export type NewCustomerGroup = Insertable<CustomerGroupTable>;
export type CustomerGroupUpdate = Updateable<CustomerGroupTable>;

// table customer_group_customers (pivot table)
export interface CustomerGroupCustomerTable {
  customer_id: string;
  customer_group_id: string;
  created_at: Generated<string>;
}
export type CustomerGroupCustomer = Selectable<CustomerGroupCustomerTable>;
export type NewCustomerGroupCustomer = Insertable<CustomerGroupCustomerTable>;
export type CustomerGroupCustomerUpdate = Updateable<CustomerGroupCustomerTable>;
