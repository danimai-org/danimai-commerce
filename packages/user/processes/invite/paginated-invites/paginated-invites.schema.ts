import { Type, type Static } from "typebox";
import { PaginationSchema } from "@danimai/core";

export const PaginatedInvitesSchema = PaginationSchema;

export type PaginatedInvitesProcessInput = Static<typeof PaginatedInvitesSchema>;
