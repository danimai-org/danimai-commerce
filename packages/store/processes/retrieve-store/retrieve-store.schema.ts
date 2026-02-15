import { Type, type Static } from "typebox";

export const RetrieveStoreSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveStoreProcessInput = Static<typeof RetrieveStoreSchema>;
