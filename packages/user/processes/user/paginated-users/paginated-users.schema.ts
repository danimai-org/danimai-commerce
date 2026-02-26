import { type Static } from "@sinclair/typebox";
import { createPaginatedResponseSchema, PaginationSchema, type PaginationType } from "@danimai/core";
import { MeResponseSchema } from "../retrieve-user/retrieve-user.schema";

export const PaginatedUsersSchema = PaginationSchema;

export type PaginatedUsersProcessInput = PaginationType;

export const PaginatedUsersResponseSchema =
  createPaginatedResponseSchema(MeResponseSchema);
export type PaginatedUsersProcessOutput = Static<
  typeof PaginatedUsersResponseSchema
>;
