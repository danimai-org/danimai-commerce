import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { PriceListResponseSchema } from "../retrieve-price-list/retrieve-price-list.schema";

export const PaginatedPriceListsSchema = createPaginationSchema(Type.Object({}), [
  "price_lists.id",
  "price_lists.name",
  "price_lists.type",
  "price_lists.status",
  "price_lists.starts_at",
  "price_lists.ends_at",
  "price_lists.created_at",
  "price_lists.updated_at",
]);

export type PaginatedPriceListsProcessInput = StaticDecode<
  typeof PaginatedPriceListsSchema
>;

export const PaginatedPriceListsResponseSchema =
  createPaginatedResponseSchema(PriceListResponseSchema);
export type PaginatedPriceListsProcessOutput = Static<
  typeof PaginatedPriceListsResponseSchema
>;
