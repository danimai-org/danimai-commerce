import type { Generated, Selectable, Insertable, Updateable } from "kysely";

export interface Database {
  customers: CustomerTable;
  customer_addresses: CustomerAddressTable;
  customer_groups: CustomerGroupTable;
  customer_group_customers: CustomerGroupCustomerTable;
}

// table customers
export interface CustomerTable {
  id: Generated<string>;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  has_account: boolean;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type Customer = Selectable<CustomerTable>;
export type NewCustomer = Insertable<CustomerTable>;
export type CustomerUpdate = Updateable<CustomerTable>;

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
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
}
export type CustomerAddress = Selectable<CustomerAddressTable>;
export type NewCustomerAddress = Insertable<CustomerAddressTable>;
export type CustomerAddressUpdate = Updateable<CustomerAddressTable>;

// table customer_groups
export interface CustomerGroupTable {
  id: Generated<string>;
  name: string;
  metadata: unknown | null;
  created_at: Generated<string>;
  updated_at: Generated<string>;
  deleted_at: string | null;
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
