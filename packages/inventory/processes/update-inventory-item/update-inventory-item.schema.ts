import { Type, type Static } from "typebox";

export const UpdateInventoryItemSchema = Type.Object({
  id: Type.String(),
  sku: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  requires_shipping: Type.Optional(Type.Boolean()),
});

export type UpdateInventoryItemProcessInput = Static<
  typeof UpdateInventoryItemSchema
>;
