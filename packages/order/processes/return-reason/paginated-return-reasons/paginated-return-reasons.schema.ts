import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  PaginationSchema,
} from "@danimai/core";
import type { ReturnReason } from "@danimai/order/db";
import { ReturnReasonResponseSchema } from "../update-return-reasons/update-return-reasons.schema";

export const PaginatedReturnReasonsSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<keyof Pick<ReturnReason, "label">>({
        label: true,
      })
    ),
  }),
]);

export type PaginatedReturnReasonsProcessInput = Static<
  typeof PaginatedReturnReasonsSchema
>;

export const PaginatedReturnReasonsResponseSchema =
  createPaginatedResponseSchema(ReturnReasonResponseSchema);
export type PaginatedReturnReasonsProcessOutput = Static<
  typeof PaginatedReturnReasonsResponseSchema
>;
