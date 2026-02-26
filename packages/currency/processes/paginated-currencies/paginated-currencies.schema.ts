import { type Static } from "@sinclair/typebox";
import { PaginationSchema, createPaginatedResponseSchema } from "@danimai/core";
import { CurrencyResponseSchema } from "../retrieve-currency/retrieve-currency.schema";

export const PaginatedCurrenciesSchema = PaginationSchema;

export type PaginatedCurrenciesProcessInput = Static<typeof PaginatedCurrenciesSchema>;

export const PaginatedCurrenciesResponseSchema = createPaginatedResponseSchema(CurrencyResponseSchema);

export type PaginatedCurrenciesProcessOutput = Static<typeof PaginatedCurrenciesResponseSchema>;
