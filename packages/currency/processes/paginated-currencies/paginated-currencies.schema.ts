import { Type, type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema, createPaginationSchema } from "@danimai/core";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const PaginatedCurrenciesSchema = createPaginationSchema(Type.Object({
    code: Type.Optional(Type.String()),
}), ["created_at", "code", "name", "tax_inclusive_pricing"]);

export type PaginatedCurrenciesProcessInput = Static<typeof PaginatedCurrenciesSchema>;

export const PaginatedCurrenciesResponseSchema = createPaginatedResponseSchema(CurrencyResponseSchema);

export type PaginatedCurrenciesProcessOutput = Static<typeof PaginatedCurrenciesResponseSchema>;
