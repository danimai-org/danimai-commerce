import { Type, type Static } from "@sinclair/typebox";
import { RetrieveCartResponseSchema } from "../retrieve-cart/retrieve-cart.schema";

export const ApplyCartPromoCodeSchema = Type.Object({
  id: Type.String(),
  code: Type.String({ minLength: 1 }),
});

export type ApplyCartPromoCodeProcessInput = Static<typeof ApplyCartPromoCodeSchema>;

export type ApplyCartPromoCodeProcessOutput = Static<
  typeof RetrieveCartResponseSchema
>;
