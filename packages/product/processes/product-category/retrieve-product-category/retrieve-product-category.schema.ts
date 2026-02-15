import { Type, type Static } from "typebox";

export const RetrieveProductCategorySchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductCategoryProcessInput = Static<
  typeof RetrieveProductCategorySchema
>;
