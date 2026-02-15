import { Type, type Static } from "typebox";

export const DeleteCurrenciesSchema = Type.Object({
  currency_ids: Type.Array(Type.String()),
});

export type DeleteCurrenciesProcessInput = Static<typeof DeleteCurrenciesSchema>;
