import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  PaginationSchema,
} from "@danimai/core";
import type { SalesChannel } from "@danimai/sales-channel/db";
import { SalesChannelResponseSchema } from "../update-sales-channels/update-sales-channels.schema";

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

export const PaginatedSalesChannelsResponseSchema =
  createPaginatedResponseSchema(SalesChannelResponseSchema);
export type PaginatedSalesChannelsProcessOutput = Static<
  typeof PaginatedSalesChannelsResponseSchema
>;
