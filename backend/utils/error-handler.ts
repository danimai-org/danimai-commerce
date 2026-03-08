import { NotFoundError, ValidationError } from "@danimai/core";
import type { Context } from "elysia";

export function handleProcessError(err: unknown, set: Context["set"]) {
  if (err instanceof NotFoundError) {
    set.status = 404;
    return {
      error: "NotFound",
      message: err.message,
    };
  }

  if (err instanceof ValidationError) {
    const isNotFound = err.errors?.some(
      (e: { type?: string }) => e.type === "not_found"
    );
    if (isNotFound) {
      set.status = 404;
      return {
        error: "NotFound",
        message: err.message,
      };
    }
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
