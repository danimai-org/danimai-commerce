import { Type } from "@sinclair/typebox";

export const UpdateProductTagProductsBodySchema = Type.Object({
  product_ids: Type.Array(
    Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] }),
    { uniqueItems: true }
  ),
});

export const UpdateProductTagProductsSchema = Type.Object({
  product_tag_id: Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] }),
  products: Type.Object({
    add: Type.Array(
      Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] }),
      { uniqueItems: true }
    ),
    remove: Type.Array(
      Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] }),
      { uniqueItems: true }
    ),
  }),
});
