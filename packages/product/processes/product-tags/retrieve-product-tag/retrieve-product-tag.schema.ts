import { Type, type Static } from "typebox";

export const RetrieveProductTagSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductTagProcessInput = Static<
  typeof RetrieveProductTagSchema
>;
