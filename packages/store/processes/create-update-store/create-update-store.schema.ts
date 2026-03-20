import { Type, type Static } from "@sinclair/typebox";
import { StoreResponseSchema } from "../retrieve-store/retrieve-store.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateStoreSchema = Type.Object({
  name: Type.String(),
  default_currency_code: Type.Optional(Type.String({ format: "uuid" })),
  default_sales_channel_id: Type.Optional(Type.String({ format: "uuid" })),
  default_region_id: Type.Optional(Type.String({ format: "uuid" })),
  default_location_id: Type.Optional(Type.String({ format: "uuid" })),
  metadata: Metadata,
});


export type CreateStoresProcessInput = Static<typeof CreateStoreSchema>;

export const CreateStoreResponseSchema = Type.Union([
  StoreResponseSchema,
  Type.Undefined(),
]);

export type CreateStoreProcessOutput = Static<typeof CreateStoreResponseSchema>;
