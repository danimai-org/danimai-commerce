import { Type, type Static } from "typebox";

export const RetrieveStockLocationSchema = Type.Object({
  id: Type.String(),
});

export type RetrieveStockLocationProcessInput = Static<typeof RetrieveStockLocationSchema>;
