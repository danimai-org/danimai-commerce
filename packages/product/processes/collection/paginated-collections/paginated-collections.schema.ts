import { Type, type Static } from "@sinclair/typebox";
import {
  createFilterableColumnsSchema,
  createPaginatedResponseSchema,
  PaginationSchema,
} from "@danimai/core";
import type { ProductCollection } from "../../../db/type";
import { ProductCollectionResponseSchema } from "../retrieve-collection/retrieve-collection.schema";

function coerceStringArray(value: unknown): string[] | undefined {
  if (value === undefined || value === null) return undefined;
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "") return undefined;
    return trimmed.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return undefined;
}

export const PaginatedCollectionsSchema = Type.Object({
  ...PaginationSchema.properties,
  search: Type.Optional(Type.String()),
  sales_channel_ids: Type.Optional(
    Type.Transform(Type.Union([Type.String(), Type.Array(Type.String())]))
      .Decode(coerceStringArray)
      .Encode((v: string[] | undefined) => v ?? [])
  ),
  collection_type: Type.Optional(Type.String()),
  filters: Type.Optional(
    createFilterableColumnsSchema<
      keyof Pick<ProductCollection, "title" | "handle">
    >({
      title: true,
      handle: true,
    })
  ),
});

export type PaginatedCollectionsProcessInput = Static<
  typeof PaginatedCollectionsSchema
>;

export const PaginatedCollectionsResponseSchema =
  createPaginatedResponseSchema(ProductCollectionResponseSchema);
export type PaginatedCollectionsProcessOutput = Static<
  typeof PaginatedCollectionsResponseSchema
>;
