import { Type, type Static } from "@sinclair/typebox";
import { CustomerGroupEntitySchema } from "../retrieve-customer-group/retrieve-customer-group.schema";

export const UpdateCustomerGroupSchema = Type.Object({
  id: Type.String(),
  name: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(
      Type.String(),
      Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()])
    )
  ),
});

export type UpdateCustomerGroupProcessInput = Static<typeof UpdateCustomerGroupSchema>;

export const UpdateCustomerGroupResponseSchema = Type.Union([
  CustomerGroupEntitySchema,
  Type.Undefined(),
]);
export type UpdateCustomerGroupProcessOutput = Static<
  typeof UpdateCustomerGroupResponseSchema
>;
