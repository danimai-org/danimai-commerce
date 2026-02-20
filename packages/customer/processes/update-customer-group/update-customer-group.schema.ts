import { Type, type Static } from "typebox";

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
