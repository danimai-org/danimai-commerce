import { Type, type Static } from "@sinclair/typebox";
import { ProductStatusEnum } from "../../../db/type";

// input schema
export const RetrieveProductSchema = Type.Object({
  id: Type.String(),
});
export type RetrieveProductProcessInput = Static<
  typeof RetrieveProductSchema
>;

// response schema
const RetrieveProductCategorySchema = Type.Object({
  id: Type.String(),
  value: Type.String(),
});

const RetrieveProductCollectionSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
});

const RetrieveProductAttributeSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  type: Type.String(),
  value: Type.String(),
  attribute_group_id: Type.Union([Type.String(), Type.Null()]),
});

const RetrieveProductTagSchema = Type.Object({
  id: Type.String(),
  value: Type.String(),
});

const RetrieveSalesChannelSchema = Type.Object({
  id: Type.String(),
  name: Type.String(),
});

export const RetrieveProductResponseSchema = Type.Object({
  id: Type.String(),
  title: Type.String(),
  handle: Type.String(),
  description: Type.Union([Type.String(), Type.Null()]),
  created_at: Type.Date(),
  updated_at: Type.Date(),
  category: Type.Union([RetrieveProductCategorySchema, Type.Null()]),
  collections: Type.Array(RetrieveProductCollectionSchema),
  attributes: Type.Array(RetrieveProductAttributeSchema),
  tags: Type.Array(RetrieveProductTagSchema),
  status: Type.Enum(ProductStatusEnum),
  sales_channels: Type.Array(RetrieveSalesChannelSchema),
  metadata: Type.Union([Type.Null(), Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Array(Type.String()), Type.Array(Type.Number())]))]),
});

export type RetrieveProductProcessOutput = Static<
  typeof RetrieveProductResponseSchema
>;
