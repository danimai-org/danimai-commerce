import { Type, type Static } from "@sinclair/typebox";

export const UpdateProductVariantImagesSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  files: Type.Optional(Type.Any()),
  delete_ids: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
  type: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

const MediaImageItemSchema = Type.Object({
  id: Type.String(),
  url: Type.String(),
  object_key: Type.String(),
  filename: Type.String(),
  mime_type: Type.String(),
  size: Type.String(),
  owner_type: Type.Union([Type.String(), Type.Null()]),
  owner_id: Type.Union([Type.String(), Type.Null()]),
});

export const UpdateProductVariantImagesResponseSchema = Type.Object({
  uploaded: Type.Array(MediaImageItemSchema),
  deleted_ids: Type.Array(Type.String()),
});

export type UpdateProductVariantImagesProcessInput = Static<typeof UpdateProductVariantImagesSchema>;
export type UpdateProductVariantImagesProcessOutput = Static<typeof UpdateProductVariantImagesResponseSchema>;
