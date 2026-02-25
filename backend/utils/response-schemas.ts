import { Type } from "@sinclair/typebox";

export const UnauthorizedResponseSchema = Type.Object(
  {
    error: Type.String({ description: "Error code" }),
    message: Type.String({ description: "Error message" }),
  },
  {
    description: "Unauthorized (e.g. missing or invalid Bearer token)",
    examples: [{ error: "Unauthorized", message: "Missing Authorization header" }],
  }
);

export const ValidationErrorResponseSchema = Type.Object(
  {
    error: Type.Literal("ValidationError"),
    message: Type.String(),
    errors: Type.Array(Type.Any()),
  },
  {
    description: "Validation error from process",
  }
);

export const InternalErrorResponseSchema = Type.Object(
  {
    error: Type.Literal("InternalServerError"),
    message: Type.String(),
  },
  {
    description: "Internal server error",
  }
);

export const NoContentResponseSchema = Type.Undefined({
  description: "No content",
});
