import { Type, type Static } from "typebox";

export const SetInventoryLevelSchema = Type.Object({
  inventory_item_id: Type.String(),
  location_id: Type.String(),
  stocked_quantity: Type.Number({ minimum: 0 }),
  reserved_quantity: Type.Optional(Type.Number({ minimum: 0 })),
});


export type SetInventoryLevelProcessInput = Static<
  typeof SetInventoryLevelSchema
>;
