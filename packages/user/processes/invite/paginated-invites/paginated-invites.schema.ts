import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema, type PaginationType } from "@danimai/core";
import { InviteListItemSchema } from "../create-invite/create-invite.schema";

export const PaginatedInvitesSchema = PaginationSchema;

export type PaginatedInvitesProcessInput = PaginationType;

export const PaginatedInvitesResponseSchema =
  createPaginatedResponseSchema(InviteListItemSchema);
export type PaginatedInvitesProcessOutput = Static<
  typeof PaginatedInvitesResponseSchema
>;
