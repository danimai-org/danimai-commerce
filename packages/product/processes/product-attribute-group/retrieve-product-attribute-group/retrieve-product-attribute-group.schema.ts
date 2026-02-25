import { Type, type Static } from "typebox";

export const RetrieveProductAttributeGroupSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductAttributeGroupProcessInput = Static<
  typeof RetrieveProductAttributeGroupSchema
>;
