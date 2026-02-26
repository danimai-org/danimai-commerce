import { Type, type Static } from "@sinclair/typebox";

export const BatchLinkProductsToCategorySchema = Type.Object({
  product_ids: Type.Array(Type.String()),
  category_id: Type.String(),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type BatchLinkProductsToCategoryProcessInput = Static<
  typeof BatchLinkProductsToCategorySchema
>;

export const BatchLinkProductsToCategoryResponseSchema = Type.Undefined();
export type BatchLinkProductsToCategoryProcessOutput = void;
