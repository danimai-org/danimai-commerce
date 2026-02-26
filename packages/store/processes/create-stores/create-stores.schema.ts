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
  default_currency_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_location_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const CreateStoresSchema = Type.Object({
  stores: Type.Array(CreateStoreSchema),
});

export type CreateStoreProcessInput = Static<typeof CreateStoreSchema>;
export type CreateStoresProcessInput = Static<typeof CreateStoresSchema>;

export const CreateStoresResponseSchema = Type.Array(StoreResponseSchema);

export type CreateStoresProcessOutput = Static<typeof CreateStoresResponseSchema>;
