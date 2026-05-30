import { Type, type Static } from "@sinclair/typebox";
import { PaymentProviderResponseSchema } from "../update-payment-provider/update-payment-provider.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreatePaymentProviderSchema = Type.Object({
  name: Type.String(),
  metadata: Metadata,
  active: Type.Optional(Type.Boolean()),
});

export type CreatePaymentProviderProcessInput = Static<
  typeof CreatePaymentProviderSchema
>;

export const CreatePaymentProviderResponseSchema = Type.Union([
  PaymentProviderResponseSchema,
]);
export type CreatePaymentProviderProcessOutput = Static<
  typeof CreatePaymentProviderResponseSchema
>;
