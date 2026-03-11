import { ValueErrorType as SchemaValueErrorType } from "@sinclair/typebox/errors";

export type ValueErrorType =
  | "not_found"
  | "not_unique"
  | "invalid"
  | "invalid_state"
  | "required"
  | "already_exists"
  | keyof typeof SchemaValueErrorType;