import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema, type PaginationType } from "@danimai/core";
import { PermissionResponseSchema } from "../retrieve-permission/retrieve-permission.schema";

export const PaginatedPermissionsSchema = PaginationSchema;

export type PaginatedPermissionsProcessInput = PaginationType;

export const PaginatedPermissionsResponseSchema =
  createPaginatedResponseSchema(PermissionResponseSchema);
export type PaginatedPermissionsProcessOutput = Static<
  typeof PaginatedPermissionsResponseSchema
>;
