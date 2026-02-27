import { Type, type Static } from "@sinclair/typebox";

export const RetrievePermissionSchema = Type.Object({
  id: Type.String({
    description: "The permission ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type RetrievePermissionProcessInput = Static<
  typeof RetrievePermissionSchema
>;

export const PermissionResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  description: Type.String(),
  created_at: Type.Date(),
  updated_at: Type.Date(),   deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrievePermissionResponseSchema = Type.Union([
  PermissionResponseSchema,
  Type.Undefined(),
]);
export type RetrievePermissionProcessOutput = Static<
  typeof RetrievePermissionResponseSchema
>;
