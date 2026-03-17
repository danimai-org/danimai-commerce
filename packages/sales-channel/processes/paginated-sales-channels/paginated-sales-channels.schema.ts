import { Type, type Static } from "@sinclair/typebox";
import {
  createPaginationSchema,
  createPaginatedResponseSchema,
} from "@danimai/core";
import { SalesChannelResponseSchema } from "../retrieve-sales-channel/retrieve-sales-channel.schema";

export const PaginatedSalesChannelsSchema = createPaginationSchema(
  Type.Object({
    is_default: Type.Optional(Type.Boolean()),
  }),
  [
    "sales_channels.created_at",
    "sales_channels.updated_at",
    "sales_channels.name",
    "sales_channels.is_default",
  ]
);

export type PaginatedSalesChannelsProcessInput = Static<
  typeof PaginatedSalesChannelsSchema
>;

export const PaginatedSalesChannelsResponseSchema =
  createPaginatedResponseSchema(SalesChannelResponseSchema);
export type PaginatedSalesChannelsProcessOutput = Static<
  typeof PaginatedSalesChannelsResponseSchema
>;
