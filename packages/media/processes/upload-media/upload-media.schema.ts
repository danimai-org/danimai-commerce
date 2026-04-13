import { Type, type Static } from "@sinclair/typebox";

export const UploadMediaSchema = Type.Object({
  file: Type.Any(),
  type: Type.String(),
  owner_type: Type.Optional(Type.String()),
  owner_id: Type.Optional(Type.String({ format: "uuid" })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Any())),
});

const UploadMediaItemSchema = Type.Object({
  id: Type.String(),
  type: Type.String(),
  owner_type: Type.Union([Type.String(), Type.Null()]),
  owner_id: Type.Union([Type.String(), Type.Null()]),
  url: Type.String(),
  object_key: Type.String(),
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

export const UploadMediaResponseSchema = Type.Array(UploadMediaItemSchema);

type UploadMediaSchemaInput = Static<typeof UploadMediaSchema>;
export type UploadMediaProcessInput = Omit<UploadMediaSchemaInput, "file"> & {
  file: File | File[];
};
export type UploadMediaProcessOutput = Static<typeof UploadMediaResponseSchema>;
