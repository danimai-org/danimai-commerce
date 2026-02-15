import { ValidationError } from "@danimai/core";
import type { Context } from "elysia";

export function handleProcessError(err: unknown, set: Context["set"]) {
  if (err instanceof ValidationError) {
    set.status = 400;
    return {
      error: "ValidationError",
      message: err.message,
      errors: err.errors,
    };
  }

  if (err instanceof Error) {
    set.status = 500;
    console.error(err);
    return {
      error: "InternalServerError",
      message: err.message,
    };
  }

  set.status = 500;
  return {
    error: "InternalServerError",
    message: "An unknown error occurred",
  };
}
