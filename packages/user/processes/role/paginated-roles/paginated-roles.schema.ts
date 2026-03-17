import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { RoleResponseSchema } from "../retrieve-role/retrieve-role.schema";

export const PaginatedRolesSchema = createPaginationSchema(
  Type.Object({}),
  [
    "roles.id",
    "roles.name",
    "roles.description",
    "roles.created_at",
    "roles.updated_at",
  ]
);

export type PaginatedRolesProcessInput = StaticDecode<
  typeof PaginatedRolesSchema
>;

export const PaginatedRolesResponseSchema =
  createPaginatedResponseSchema(RoleResponseSchema);
export type PaginatedRolesProcessOutput = Static<
  typeof PaginatedRolesResponseSchema
>;
