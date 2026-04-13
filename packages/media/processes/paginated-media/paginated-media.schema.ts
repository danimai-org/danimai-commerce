import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import { createPaginatedResponseSchema, createPaginationSchema } from "@danimai/core";

export const PaginatedMediaSchema = createPaginationSchema(
  Type.Object({
    type: Type.Optional(Type.String()),
    owner_type: Type.Optional(Type.String()),
    owner_id: Type.Optional(Type.String({ format: "uuid" })),
    mime_type: Type.Optional(Type.String()),
  }),
  ["media_files.created_at", "media_files.filename", "media_files.type"]
);

const PaginatedMediaItemSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  owner_type: Type.Union([Type.String(), Type.Null()]),
  owner_id: Type.Union([Type.String(), Type.Null()]),
  url: Type.String(),
  filename: Type.String(),
  original_filename: Type.String(),
  mime_type: Type.String(),
  size: Type.String(),
  provider: Type.String(),
  bucket: Type.String(),
  region: Type.String(),
  metadata: Type.Union([Type.Record(Type.String(), Type.Any()), Type.Null()]),
  created_at: Type.Any(),
});

export const PaginatedMediaResponseSchema = createPaginatedResponseSchema(PaginatedMediaItemSchema);

export type PaginatedMediaProcessInput = StaticDecode<typeof PaginatedMediaSchema>;
export type PaginatedMediaProcessOutput = Static<typeof PaginatedMediaResponseSchema>;
