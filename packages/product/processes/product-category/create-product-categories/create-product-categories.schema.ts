import { Type, type Static } from "typebox";

export const CreateProductCategorySchema = Type.Object({
  value: Type.String(),
  parent_id: Type.Optional(Type.String()),
  status: Type.Optional(Type.Union([Type.Literal("active"), Type.Literal("inactive")])),
  visibility: Type.Optional(Type.Union([Type.Literal("public"), Type.Literal("private")])),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});

export type CreateProductCategoryProcessInput = Static<
  typeof CreateProductCategorySchema
>;
