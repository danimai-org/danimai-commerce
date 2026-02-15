import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedCurrenciesSchema = PaginationSchema;

export type PaginatedCurrenciesProcessInput = Static<typeof PaginatedCurrenciesSchema>;
