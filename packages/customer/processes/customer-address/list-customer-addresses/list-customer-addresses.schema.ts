import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { CustomerAddressResponseSchema } from "../create-customer-address/create-customer-address.schema";

export const CUSTOMER_ADDRESS_SORT_FIELDS = [
  "id",
  "first_name",
  "last_name",
  "city",
  "country_code",
  "is_default",
  "created_at",
  "updated_at",
] as const;

const listCustomerAddressesPagination = createPaginationSchema(
  Type.Object({}),
  [...CUSTOMER_ADDRESS_SORT_FIELDS],
);

export const ListCustomerAddressesSchema = Type.Object({
  ...listCustomerAddressesPagination.properties,
  customer_id: Type.String(),
});

export type ListCustomerAddressesProcessInput = StaticDecode<
  typeof ListCustomerAddressesSchema
>;

export const ListCustomerAddressesResponseSchema =
  createPaginatedResponseSchema(CustomerAddressResponseSchema);
export type ListCustomerAddressesProcessOutput = Static<
  typeof ListCustomerAddressesResponseSchema
>;
