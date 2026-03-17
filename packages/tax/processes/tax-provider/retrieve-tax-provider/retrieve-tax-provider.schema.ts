import { Type, type Static } from "@sinclair/typebox";
import { TaxProviderResponseSchema } from "../update-tax-provider/update-tax-provider.schema";

export const RetrieveTaxProviderSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveTaxProviderProcessInput = Static<
  typeof RetrieveTaxProviderSchema
>;

export const RetrieveTaxProviderResponseSchema = Type.Union([
  TaxProviderResponseSchema,
  Type.Undefined(),
]);
export type RetrieveTaxProviderProcessOutput = Static<
  typeof RetrieveTaxProviderResponseSchema
>;
