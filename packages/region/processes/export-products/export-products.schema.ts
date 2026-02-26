import { Type, type Static } from "@sinclair/typebox";

export const ExportProductsSchema = Type.Object({
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 1000, default: 100 })),
  offset: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
});

export type ExportProductsProcessInput = Static<typeof ExportProductsSchema>;

export const ExportProductsResponseSchema = Type.Object({
  products: Type.Array(Type.Any()),
  total: Type.Number(),
});

export type ExportProductsProcessOutput = Static<typeof ExportProductsResponseSchema>;
