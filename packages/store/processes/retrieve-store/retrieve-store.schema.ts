import { Type, type Static } from "@sinclair/typebox";

export const RetrieveStoreSchema = Type.Object({});

export type RetrieveStoreProcessInput = Static<typeof RetrieveStoreSchema>;

export const StoreResponseSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
  default_currency_code: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
  default_sales_channel_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
  default_region_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
  default_location_id: Type.Union([Type.String({ format: "uuid" }), Type.Null()]),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});

export const RetrieveStoreResponseSchema = Type.Union([
  StoreResponseSchema,
  Type.Undefined(),
]);

export type RetrieveStoreProcessOutput = Static<typeof RetrieveStoreResponseSchema>;
