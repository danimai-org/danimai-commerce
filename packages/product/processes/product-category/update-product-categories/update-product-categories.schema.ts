import { Type, type Static } from "typebox";

export const UpdateProductCategorySchema = Type.Object({
  id: Type.String(),
  value: Type.Optional(Type.String()),
  parent_id: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([Type.Literal("active"), Type.Literal("inactive")])),
  visibility: Type.Optional(Type.Union([Type.Literal("public"), Type.Literal("private")])),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type UpdateProductCategoryProcessInput = Static<
  typeof UpdateProductCategorySchema
>;
