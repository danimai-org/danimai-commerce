import { Type, type Static } from "typebox";

export const UpdateShippingOptionSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  service_zone_id: Type.Optional(Type.String()),
  shipping_profile_id: Type.Optional(Type.String()),
  shipping_option_type_id: Type.Optional(Type.String()),
  provider_id: Type.Optional(Type.String()),
  price_type: Type.Optional(
    Type.Union([Type.Literal("flat"), Type.Literal("calculated")])
  ),
  amount: Type.Optional(Type.String()),
  data: Type.Optional(Type.Unknown()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateShippingOptionProcessInput = Static<
  typeof UpdateShippingOptionSchema
>;
