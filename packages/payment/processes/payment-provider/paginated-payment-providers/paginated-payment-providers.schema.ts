import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { PaymentProviderResponseSchema } from "../update-payment-provider/update-payment-provider.schema";

export const PaginatedPaymentProvidersSchema = createPaginationSchema(
  Type.Object({
    active: Type.Optional(Type.Boolean()),
  }),
  [
    "payment_providers.id",
    "payment_providers.name",
    "payment_providers.active",
    "payment_providers.created_at",
    "payment_providers.updated_at",
  ]
);

export type PaginatedPaymentProvidersProcessInput = StaticDecode<
  typeof PaginatedPaymentProvidersSchema
>;

export const PaginatedPaymentProvidersResponseSchema =
  createPaginatedResponseSchema(PaymentProviderResponseSchema);
export type PaginatedPaymentProvidersProcessOutput = Static<
  typeof PaginatedPaymentProvidersResponseSchema
>;
