import { Type, type Static } from "@sinclair/typebox";
import { ProductTagResponseSchema } from "../retrieve-product-tag/retrieve-product-tag.schema";


export const UpdateProductTagBodySchema = Type.Object({
  value: Type.Optional(Type.String({ examples: ["BestSeller"] })),
  metadata: Type.Optional(Type.Record(Type.String(), Type.Union([Type.String(), Type.Number()]))),
});


export const UpdateProductTagSchema = Type.Object({
  id: Type.String({ format: "uuid", }),
  ...UpdateProductTagBodySchema.properties,
});

export type UpdateProductTagProcessInput = Static<
  typeof UpdateProductTagSchema
>;

export const UpdateProductTagResponseSchema = Type.Union([
  ProductTagResponseSchema,
  Type.Undefined(),
]);
export type UpdateProductTagProcessOutput = Static<
  typeof UpdateProductTagResponseSchema
>;
