import { Type, type Static } from "typebox";

export const UpdateStockLocationSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  address_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateStockLocationProcessInput = Static<typeof UpdateStockLocationSchema>;
