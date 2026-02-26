import { Type, type Static } from "@sinclair/typebox";
import { SessionResponseSchema } from "../create-session/create-session.schema";

export const ExpireSessionSchema = Type.Object({
  id: Type.String({
    format: "uuid",
    description: "The session ID",
    examples: ["550e8400-e29b-41d4-a716-446655440000"],
  }),
});

export type ExpireSessionProcessInput = Static<typeof ExpireSessionSchema>;

export const ExpireSessionResponseSchema = Type.Union([
  SessionResponseSchema,
  Type.Undefined(),
]);
export type ExpireSessionProcessOutput = Static<
  typeof ExpireSessionResponseSchema
>;
