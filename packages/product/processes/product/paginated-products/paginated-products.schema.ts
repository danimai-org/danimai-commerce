import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import {
  commaSeparatedIds,
  createPaginatedResponseSchema,
  createPaginationSchema,
} from "@danimai/core";
import { ProductStatusEnum } from "../../../db/type";

export const PaginatedProductsSchema = createPaginationSchema(
  Type.Object({
    status: Type.Optional(Type.Enum(ProductStatusEnum)),
    category_ids: commaSeparatedIds({ format: "uuid" }),
    tag_ids: commaSeparatedIds({ format: "uuid" }),
    sales_channel_ids: commaSeparatedIds({ format: "uuid" }),
    collection_ids: commaSeparatedIds({ format: "uuid" }),
  }),
  ["products.title", "products.handle", "products.status"]
);

export type PaginatedProductsProcessInput = StaticDecode<
  typeof PaginatedProductsSchema
>;


const PaginatedProductItemSchema = Type.Object({
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
});

export const PaginatedProductsResponseSchema = createPaginatedResponseSchema(PaginatedProductItemSchema);

export type PaginatedProductsProcessOutput = Static<
  typeof PaginatedProductsResponseSchema
>;
