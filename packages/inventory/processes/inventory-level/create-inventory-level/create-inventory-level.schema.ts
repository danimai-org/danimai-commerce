import { Type, type Static } from "@sinclair/typebox";
import { InventoryLevelResponseSchema } from "../update-inventory-level";

export const CreateInventoryLevelSchema = Type.Object({
  inventory_item_id: Type.String({ format: "uuid" }),
  location_id: Type.String({ format: "uuid" }),
  available_quantity: Type.Number({ default: 0 }),
  stocked_quantity: Type.Number({ default: 0 }),
  reserved_quantity: Type.Number({ default: 0 }),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type CreateInventoryLevelProcessInput = Static<
  typeof CreateInventoryLevelSchema
>;

export const CreateInventoryLevelResponseSchema = Type.Union([
  InventoryLevelResponseSchema,
  Type.Undefined(),
]);
export type CreateInventoryLevelProcessOutput = Static<
  typeof CreateInventoryLevelResponseSchema
>;
