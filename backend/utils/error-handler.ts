import { ValidationError } from "@danimai/core";
import type { Context } from "elysia";

function ensureCorsHeaders(set: Context["set"]) {
  if (!set.headers) set.headers = {};
  (set.headers as Record<string, string>)["Access-Control-Allow-Origin"] =
    process.env.CORS_ORIGIN || "*";
}

export function handleProcessError(err: unknown, set: Context["set"]) {
  ensureCorsHeaders(set);
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
