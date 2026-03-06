import { Type, type Static } from "@sinclair/typebox";

export const CreateInviteSchema = Type.Object({
  email: Type.String({
    description: "The email address to invite",
    examples: ["user@example.com"],
    pattern: "^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$",
  }),
  role_ids: Type.Optional(
    Type.Array(Type.String({ format: "uuid", description: "Role ID" }), {
      description: "Role IDs to assign (multiple allowed)",
    })
  ),
});

export type CreateInviteProcessInput = Static<typeof CreateInviteSchema>;

export const InviteResponseSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  role: Type.Union([Type.String(), Type.Null()]),
  accepted: Type.Boolean(),
  token: Type.String(),
  expires_at: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

// created_at: Type.Date(),
//   updated_at: Type.Date(),
//   deleted_at: Type.Union([Type.Date(), Type.Null()]),
/** Invite without token (for list); date fields as string for JSON response */
export const InviteListItemSchema = Type.Object({
  id: Type.String(),
  email: Type.String(),
  role: Type.Union([Type.String(), Type.Null()]),
  accepted: Type.Boolean(),
  expires_at: Type.String(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export const CreateInviteResponseSchema = Type.Union([
  InviteResponseSchema,
  Type.Undefined(),
]);
export type CreateInviteProcessOutput = Static<
  typeof CreateInviteResponseSchema
>;
