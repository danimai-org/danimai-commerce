import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { PermissionResponseSchema } from "../retrieve-permission/retrieve-permission.schema";

export const PaginatedPermissionsSchema = createPaginationSchema(
  Type.Object({}),
  [
    "permissions.id",
    "permissions.name",
    "permissions.description",
    "permissions.created_at",
    "permissions.updated_at",
  ]
);

export type PaginatedPermissionsProcessInput = StaticDecode<
  typeof PaginatedPermissionsSchema
>;

export const PaginatedPermissionsResponseSchema =
  createPaginatedResponseSchema(PermissionResponseSchema);
export type PaginatedPermissionsProcessOutput = Static<
  typeof PaginatedPermissionsResponseSchema
>;
