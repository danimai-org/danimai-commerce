import { type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedCustomersSchema = PaginationSchema;

export type PaginatedCustomersProcessInput = Static<typeof PaginatedCustomersSchema>;
