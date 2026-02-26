import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema, type PaginationType } from "@danimai/core";
import { InviteResponseSchema } from "../create-invite/create-invite.schema";

export const PaginatedInvitesSchema = PaginationSchema;

export type PaginatedInvitesProcessInput = PaginationType;

export const PaginatedInvitesResponseSchema =
  createPaginatedResponseSchema(InviteResponseSchema);
export type PaginatedInvitesProcessOutput = Static<
  typeof PaginatedInvitesResponseSchema
>;
