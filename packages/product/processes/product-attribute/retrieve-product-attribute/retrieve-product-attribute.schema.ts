import { Type, type Static } from "typebox";

export const RetrieveProductAttributeSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductAttributeProcessInput = Static<
  typeof RetrieveProductAttributeSchema
>;
