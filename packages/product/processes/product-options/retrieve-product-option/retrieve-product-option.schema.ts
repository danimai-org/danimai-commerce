import { Type, type Static } from "typebox";

export const RetrieveProductOptionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductOptionProcessInput = Static<
  typeof RetrieveProductOptionSchema
>;
