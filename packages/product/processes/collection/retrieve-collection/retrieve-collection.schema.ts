import { Type, type Static } from "typebox";

export const RetrieveCollectionSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveCollectionProcessInput = Static<
  typeof RetrieveCollectionSchema
>;
