import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  PaginationSchema,
} from "@danimai/core";
import type { ReturnReason } from "@danimai/order/db";

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
