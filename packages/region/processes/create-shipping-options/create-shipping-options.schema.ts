import { Type, type Static } from "typebox";

export const CreateShippingOptionSchema = Type.Object({
  name: Type.String(),
  service_zone_id: Type.String(),
  shipping_profile_id: Type.String(),
  shipping_option_type_id: Type.String(),
  provider_id: Type.String(),
  price_type: Type.Union([Type.Literal("flat"), Type.Literal("calculated")]),
  amount: Type.Optional(Type.String()),
  data: Type.Optional(Type.Unknown()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export const CreateShippingOptionsSchema = Type.Object({
  shipping_options: Type.Array(CreateShippingOptionSchema),
});

export type CreateShippingOptionProcessInput = Static<
  typeof CreateShippingOptionSchema
>;
export type CreateShippingOptionsProcessInput = Static<
  typeof CreateShippingOptionsSchema
>;
