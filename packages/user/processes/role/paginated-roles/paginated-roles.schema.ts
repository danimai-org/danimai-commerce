import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema, type PaginationType } from "@danimai/core";
import { RoleResponseSchema } from "../retrieve-role/retrieve-role.schema";

export const PaginatedRolesSchema = PaginationSchema;

export type PaginatedRolesProcessInput = PaginationType;

export const PaginatedRolesResponseSchema =
  createPaginatedResponseSchema(RoleResponseSchema);
export type PaginatedRolesProcessOutput = Static<
  typeof PaginatedRolesResponseSchema
>;
