import { Type, type Static } from "@sinclair/typebox";

export const RetrieveUserSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The user ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type RetrieveUserProcessInput = Static<typeof RetrieveUserSchema>;

export const MeResponseSchema = Type.Object(
  {
    id: Type.String(),
    email: Type.String(),
    first_name: Type.Union([Type.String(), Type.Null()]),
    last_name: Type.Union([Type.String(), Type.Null()]),
    avatar_url: Type.Union([Type.String(), Type.Null()]),
    metadata: Type.Union([Type.Unknown(), Type.Null()]),
    created_at: Type.Date(),
    updated_at: Type.Date(),
    deleted_at: Type.Union([Type.Date(), Type.Null()]),
    role_id: Type.Union([Type.String(), Type.Null()]),
  },
  {
    examples: [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "user@example.com",
        first_name: "John",
        last_name: "Doe",
        avatar_url: null,
        metadata: null,
        created_at: "2025-01-01T00:00:00.000Z",
        updated_at: "2025-01-01T00:00:00.000Z",
        deleted_at: null,
        role_id: "550e8400-e29b-41d4-a716-446655440001",
      },
    ],
  }
);

export const RetrieveUserResponseSchema = Type.Union([
  MeResponseSchema,
  Type.Undefined(),
]);
export type RetrieveUserProcessOutput = Static<
  typeof RetrieveUserResponseSchema
>;
