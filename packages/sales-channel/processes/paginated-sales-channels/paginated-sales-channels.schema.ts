import { Type, type Static } from "typebox";
import {
  createFilterableColumnsSchema,
  PaginationSchema,
} from "@danimai/core";
import type { SalesChannel } from "@danimai/sales-channel/db";

export const PaginatedSalesChannelsSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
    filters: Type.Optional(
      createFilterableColumnsSchema<keyof Pick<SalesChannel, "name" | "is_default">>({
        name: true,
        is_default: true,
      })
    ),
  }),
]);

export type PaginatedSalesChannelsProcessInput = Static<
  typeof PaginatedSalesChannelsSchema
>;
