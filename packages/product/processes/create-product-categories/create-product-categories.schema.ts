import { Type, type Static } from "@sinclair/typebox";

export const createProductCategorySchema = Type.Object({
  value: Type.String(),
  parent_id: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Unknown()),
});

export type CreateProductCategoryInput = Static<
  typeof createProductCategorySchema
>;
