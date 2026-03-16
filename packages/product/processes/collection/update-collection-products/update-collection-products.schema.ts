import { Type } from "@sinclair/typebox";
export const UpdateCollectionProductsBodySchema = Type.Object({
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

export const UpdateCollectionProductsSchema = Type.Object({
  ...UpdateCollectionProductsBodySchema.properties,
  collection_id: Type.String({ format: "uuid", examples: ["123e4567-e89b-12d3-a456-426614174000"] }),
});
