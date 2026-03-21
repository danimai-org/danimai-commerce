import { Type, type Static } from "@sinclair/typebox";
import { InventoryItemResponseSchema } from "../retrieve-inventory-item/retrieve-inventory-item.schema";

const MetadataSchema = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateInventoryItemSchema = Type.Object({
  sku: Type.String(),
  requires_shipping: Type.Boolean({ default: false }),
  metadata: MetadataSchema,
});

export type CreateInventoryItemProcessInput = Static<
  typeof CreateInventoryItemSchema
>;

export const CreateInventoryItemResponseSchema = Type.Union([
  InventoryItemResponseSchema,
  Type.Undefined(),
]);
export type CreateInventoryItemProcessOutput = Static<
  typeof CreateInventoryItemResponseSchema
>;
