import { Type, type Static } from "@sinclair/typebox";
import { SalesChannelResponseSchema } from "../retrieve-sales-channel/retrieve-sales-channel.schema";

const Metadata = Type.Optional(
  Type.Record(
    Type.String(),
    Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
  )
);

export const CreateSalesChannelSchema = Type.Object({
  name: Type.String(),
  description: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  is_default: Type.Optional(Type.Boolean()),
  metadata: Metadata,
});


export type CreateSalesChannelProcessInput = Static<typeof CreateSalesChannelSchema>;

export const CreateSalesChannelResponseSchema = Type.Union([SalesChannelResponseSchema, Type.Undefined()]);
export type CreateSalesChannelProcessOutput = Static<
  typeof CreateSalesChannelResponseSchema
>;
