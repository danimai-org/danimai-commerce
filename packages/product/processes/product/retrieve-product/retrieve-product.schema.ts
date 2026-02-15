import { Type, type Static } from "typebox";

export const RetrieveProductSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductProcessInput = Static<
  typeof RetrieveProductSchema
>;
