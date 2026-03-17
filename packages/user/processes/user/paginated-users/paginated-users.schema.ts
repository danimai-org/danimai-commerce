import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { MeResponseSchema } from "../retrieve-user/retrieve-user.schema";

export const PaginatedUsersSchema = createPaginationSchema(
  Type.Object({}),
  [
    "users.id",
    "users.email",
    "users.first_name",
    "users.last_name",
    "users.created_at",
    "users.updated_at",
  ]
);

export type PaginatedUsersProcessInput = StaticDecode<
  typeof PaginatedUsersSchema
>;

export const PaginatedUsersResponseSchema =
  createPaginatedResponseSchema(MeResponseSchema);
export type PaginatedUsersProcessOutput = Static<
  typeof PaginatedUsersResponseSchema
>;
