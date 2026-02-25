import { Type, type Static } from "@sinclair/typebox";

export const ExpireSessionSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The session ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type ExpireSessionProcessInput = Static<typeof ExpireSessionSchema>;
