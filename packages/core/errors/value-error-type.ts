import type { TLocalizedValidationError } from "typebox/error";

export type ValueErrorType =
  | "not_found"
  | "not_unique"
  | "invalid"
  | "invalid_state"
  | TLocalizedValidationError["keyword"];