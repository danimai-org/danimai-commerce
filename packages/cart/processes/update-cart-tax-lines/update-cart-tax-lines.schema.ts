import { Type, type Static } from "@sinclair/typebox";
import { RetrieveCartResponseSchema } from "../retrieve-cart/retrieve-cart.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const UpdateCartTaxLineInputSchema = Type.Object({
  id: Type.Optional(Type.String()),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  code: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  rate: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  provider_id: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  metadata: Metadata,
});

export const UpdateCartTaxLinesItemSchema = Type.Object({
  line_item_id: Type.String(),
  tax_lines: Type.Array(UpdateCartTaxLineInputSchema),
});

export const UpdateCartTaxLinesSchema = Type.Object({
  id: Type.String(),
  items: Type.Array(UpdateCartTaxLinesItemSchema),
});

export type UpdateCartTaxLinesProcessInput = Static<
  typeof UpdateCartTaxLinesSchema
>;

export type UpdateCartTaxLinesProcessOutput = Static<
  typeof RetrieveCartResponseSchema
>;
