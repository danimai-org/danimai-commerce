import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";

export const InviteListItemSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  role: Type.Union([Type.String(), Type.Null()]),
  accepted: Type.Boolean(),
  expires_at: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const PaginatedInvitesSchema = createPaginationSchema(
  Type.Object({}),
  [
    "invites.id",
    "invites.email",
    "invites.role",
    "invites.accepted",
    "invites.expires_at",
    "invites.created_at",
    "invites.updated_at",
  ]
);

export type PaginatedInvitesProcessInput = StaticDecode<
  typeof PaginatedInvitesSchema
>;

export const PaginatedInvitesResponseSchema =
  createPaginatedResponseSchema(InviteListItemSchema);
export type PaginatedInvitesProcessOutput = Static<
  typeof PaginatedInvitesResponseSchema
>;
