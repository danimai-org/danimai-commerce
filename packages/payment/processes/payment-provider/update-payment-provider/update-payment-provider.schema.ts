import { Type, type Static } from "@sinclair/typebox";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const UpdatePaymentProviderSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.Optional(Type.String()),
  metadata: Metadata,
  active: Type.Optional(Type.Boolean()),
});

export type UpdatePaymentProviderProcessInput = Static<
  typeof UpdatePaymentProviderSchema
>;

export const PaymentProviderResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  name: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  active: Type.Boolean(),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdatePaymentProviderResponseSchema = Type.Union([
  PaymentProviderResponseSchema,
  Type.Undefined(),
]);
export type UpdatePaymentProviderProcessOutput = Static<
  typeof UpdatePaymentProviderResponseSchema
>;
