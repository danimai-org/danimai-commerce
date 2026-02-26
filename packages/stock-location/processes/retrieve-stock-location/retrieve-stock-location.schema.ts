import { Type, type Static } from "@sinclair/typebox";

export const RetrieveStockLocationSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveStockLocationProcessInput = Static<typeof RetrieveStockLocationSchema>;

export const StockLocationResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.Union([Type.String(), Type.Null()]),
  address_id: Type.Union([Type.String(), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.String(),
  updated_at: Type.String(),
  deleted_at: Type.Union([Type.String(), Type.Null()]),
});

export type StockLocationProcessOutput = Static<typeof StockLocationResponseSchema>;
