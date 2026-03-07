import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  createPaginationSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Product, } from "../../../db/type";
import { ProductStatusEnum } from "../../../db/type";

export const PaginatedProductsSchema = createPaginationSchema(
  Type.Object({
    status: Type.Optional(Type.Enum(ProductStatusEnum)),
    category_ids: Type.Optional(Type.Array(Type.String())),
    tag_ids: Type.Optional(Type.Array(Type.String())),
    sales_channel_ids: Type.Optional(Type.Array(Type.String())),
    collection_ids: Type.Optional(Type.Array(Type.String())),
    }),
    ["products.title", "products.handle", "products.status"]
  );

export type PaginatedProductsProcessInput = Static<
  typeof PaginatedProductsSchema
>;

const paginationQueryProperties = (PaginationSchema as unknown as {
  properties?: Record<string, ReturnType<typeof Type.Any>>;
}).properties ?? {};

/** Query-only schema for Elysia route (single Type.Object, no Intersect). */
export const PaginatedProductsQuerySchema = Type.Object({
  ...paginationQueryProperties,
  category_id: Type.Optional(Type.String()),
  category_ids: Type.Optional(Type.Array(Type.String())),
  search: Type.Optional(Type.String()),
  filters: Type.Optional(
    createFilterableColumnsSchema<
      keyof Pick<Product, "title" | "handle" | "status" | "category_id">
    >({
      title: true,
      handle: true,
      status: [
        FilterOperator.EQUAL,
        FilterOperator.NOT_EQUAL,
        FilterOperator.IN,
        FilterOperator.NOT_IN,
      ],
      category_id: [
        FilterOperator.EQUAL,
        FilterOperator.NOT_EQUAL,
        FilterOperator.IS_NULL,
        FilterOperator.IS_NOT_NULL,
      ],
    }),
  ),
});

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
