import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  commaSeparatedIds,
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductStatusEnum } from "../../../db/type";

export const StorefrontPaginatedProductsSchema = createPaginationSchema(
  Type.Object({
    status: Type.Optional(Type.Enum(ProductStatusEnum)),
    category_ids: commaSeparatedIds({ format: "uuid" }),
    tag_ids: commaSeparatedIds({ format: "uuid" }),
    sales_channel_ids: commaSeparatedIds({ format: "uuid" }),
    collection_ids: commaSeparatedIds({ format: "uuid" }),
  }),
  ["products.title", "products.handle", "products.status"]
);

export type StorefrontPaginatedProductsProcessInput = StaticDecode<
  typeof StorefrontPaginatedProductsSchema
>;

const StorefrontPaginatedProductItemSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
  status: Type.Enum(ProductStatusEnum),
  variant_count: Type.Number(),
  category: Type.Union([
    Type.Object({
      id: Type.String(),
      value: Type.String(),
    }),
    Type.Null(),
  ]),
  sales_channels: Type.Array(
    Type.Object({
      id: Type.String(),
      name: Type.String(),
    }),
  ),
  variant: Type.Union([
    Type.Object({
      id: Type.String(),
      title: Type.String(),
      sku: Type.Union([Type.String(), Type.Null()]),
      thumbnail: Type.Union([Type.String(), Type.Null()]),
      variant_rank: Type.Union([Type.Number(), Type.Null()]),
      price: Type.Union([
        Type.Object({
          amount: Type.String(),
          currency_code: Type.String(),
          min_quantity: Type.Union([Type.Number(), Type.Null()]),
          max_quantity: Type.Union([Type.Number(), Type.Null()]),
          price_list_id: Type.Union([Type.String(), Type.Null()]),
        }),
        Type.Null(),
      ]),
    }),
    Type.Null(),
  ]),
});

export const StorefrontPaginatedProductsResponseSchema = createPaginatedResponseSchema(
  StorefrontPaginatedProductItemSchema
);

export type StorefrontPaginatedProductsProcessOutput = Static<
  typeof StorefrontPaginatedProductsResponseSchema
>;
