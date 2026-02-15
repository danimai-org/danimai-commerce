import { Type, type Static } from "typebox";

export const RetrieveProductVariantSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveProductVariantProcessInput = Static<
  typeof RetrieveProductVariantSchema
>;
