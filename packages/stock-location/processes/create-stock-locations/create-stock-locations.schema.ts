import { Type, type Static } from "typebox";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateStockLocationSchema = Type.Object({
  name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const CreateStockLocationsSchema = Type.Object({
  stock_locations: Type.Array(CreateStockLocationSchema),
});

export type CreateStockLocationProcessInput = Static<typeof CreateStockLocationSchema>;
export type CreateStockLocationsProcessInput = Static<typeof CreateStockLocationsSchema>;
