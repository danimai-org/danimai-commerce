import { Type, type Static } from "@sinclair/typebox";
import { TaxProviderResponseSchema } from "../update-tax-provider/update-tax-provider.schema";

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


export type CreateTaxProviderProcessInput = Static<typeof CreateTaxProviderSchema>;

export const CreateTaxProviderResponseSchema = Type.Union([TaxProviderResponseSchema]);
export type CreateTaxProviderProcessOutput = Static<
  typeof CreateTaxProviderResponseSchema
>;
