import { Type, type Static } from "typebox";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateTaxProviderSchema = Type.Object({
  name: Type.String(),
  is_installed: Type.Optional(Type.Boolean()),
  metadata: Metadata,
});

export const CreateTaxProvidersSchema = Type.Object({
  tax_providers: Type.Array(CreateTaxProviderSchema),
});

export type CreateTaxProviderProcessInput = Static<typeof CreateTaxProviderSchema>;
export type CreateTaxProvidersProcessInput = Static<typeof CreateTaxProvidersSchema>;
