import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const UpdateCurrencyParamsSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
});

const updateCurrencyBodyFields = {
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
  symbol: Type.Optional(Type.String()),
  symbol_native: Type.Optional(Type.String()),
  name: Type.Optional(Type.String()),
  code: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))),
} as const;

/** HTTP body for PUT /currencies/:id — id is from the path only. */
export const UpdateCurrencyPatchBodySchema = Type.Object({ ...updateCurrencyBodyFields });

export const UpdateCurrencyBodySchema = Type.Object({
  ...UpdateCurrencyParamsSchema.properties,
  ...updateCurrencyBodyFields,
});

export type UpdateCurrencyProcessInput = StaticDecode<typeof UpdateCurrencyBodySchema>;

export const UpdateCurrencyResponseSchema = Type.Union([CurrencyResponseSchema, Type.Undefined()]);

export type UpdateCurrencyProcessOutput = Static<typeof UpdateCurrencyResponseSchema>;
