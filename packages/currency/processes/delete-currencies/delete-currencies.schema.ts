import { commaSeparatedIds } from "@danimai/core";
import { Type, type Static, type StaticDecode } from "@sinclair/typebox";

export const DeleteCurrenciesSchema = Type.Object({
  ids: Type.Array(Type.String({ format: "uuid" })),
});

export type DeleteCurrenciesProcessInput = StaticDecode<typeof DeleteCurrenciesSchema>;

export const DeleteCurrenciesResponseSchema = Type.Undefined();

export type DeleteCurrenciesProcessOutput = void;
