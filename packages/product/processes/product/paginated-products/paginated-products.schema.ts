import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  FilterOperator,
  PaginationSchema,
} from "@danimai/core";
import type { Product } from "../../../db/type";

export const PaginatedProductsSchema = Type.Intersect([
  PaginationSchema,
  Type.Object({
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
  }),
]);

export type PaginatedProductsProcessInput = Static<
  typeof PaginatedProductsSchema
>;

const PaginatedProductItemSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
  status: Type.String(),
  thumbnail: Type.Union([Type.String(), Type.Null()]),
  variants: Type.Array(Type.Object({ id: Type.String() })),
  category_id: Type.Union([Type.String(), Type.Null()]),
  category: Type.Union(
    [
      Type.Object({
        id: Type.String(),
        value: Type.String(),
        handle: Type.String(),
      }),
      Type.Null(),
    ]
  ),
  sales_channels: Type.Array(
    Type.Object({
      id: Type.String(),
      name: Type.String(),
      description: Type.Union([Type.String(), Type.Null()]),
      is_default: Type.Boolean(),
      metadata: Type.Union([Type.Unknown(), Type.Null()]),
      created_at: Type.String(),
      updated_at: Type.String(),
      deleted_at: Type.Union([Type.String(), Type.Null()]),
    })
  ),
});

export const PaginatedProductsResponseSchema = Type.Object({
  products: Type.Array(PaginatedProductItemSchema),
  count: Type.Number(),
  offset: Type.Number(),
  limit: Type.Number(),
});
export type PaginatedProductsProcessOutput = Static<
  typeof PaginatedProductsResponseSchema
>;
