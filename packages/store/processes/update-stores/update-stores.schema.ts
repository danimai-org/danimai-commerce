import { Type, type Static } from "typebox";

export const UpdateStoreSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  default_currency_code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_sales_channel_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_region_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  default_location_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateStoreProcessInput = Static<typeof UpdateStoreSchema>;
