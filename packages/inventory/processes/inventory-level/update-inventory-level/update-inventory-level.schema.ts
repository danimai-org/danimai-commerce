import { Type, type Static } from "@sinclair/typebox";


// Body schemas
export const UpdateInventoryLevelBodySchema = Type.Object({
  location_id: Type.Optional(Type.String({ format: "uuid" })),
  stocked_quantity: Type.Optional(Type.Number()),
  reserved_quantity: Type.Optional(Type.Number()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

// Input schemas
export const UpdateInventoryLevelSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  ...UpdateInventoryLevelBodySchema.properties,
});

export type UpdateInventoryLevelProcessInput = Static<typeof UpdateInventoryLevelSchema>;


// Response schemas
export const InventoryLevelResponseSchema = Type.Object({
  id: Type.String({ format: "uuid" }),
  inventory_item_id: Type.String({ format: "uuid" }),
  location_id: Type.String({ format: "uuid" }),
  stocked_quantity: Type.Number(),
  reserved_quantity: Type.Number(),
  available_quantity: Type.Number(),
  metadata: Type.Union([Type.Unknown(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  deleted_at: Type.Union([Type.Date(), Type.Null()]),
});
export const UpdateInventoryLevelResponseSchema = Type.Union([
  InventoryLevelResponseSchema,
  Type.Undefined(),
]);
export type UpdateInventoryLevelProcessOutput = Static<
  typeof UpdateInventoryLevelResponseSchema
>;
