import { Type, type Static } from "@sinclair/typebox";

export const UpdateTaxProviderSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  is_installed: Type.Optional(Type.Boolean()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateTaxProviderProcessInput = Static<typeof UpdateTaxProviderSchema>;

export const TaxProviderResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  is_installed: Type.Boolean(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const UpdateTaxProvidersResponseSchema = Type.Union([
  TaxProviderResponseSchema,
  Type.Undefined(),
]);
export type UpdateTaxProvidersProcessOutput = Static<
  typeof UpdateTaxProvidersResponseSchema
>;
