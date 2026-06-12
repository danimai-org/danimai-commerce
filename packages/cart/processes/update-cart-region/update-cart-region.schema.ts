import { Type, type Static } from "@sinclair/typebox";
import { RetrieveCartResponseSchema } from "../retrieve-cart/retrieve-cart.schema";

export const UpdateCartRegionSchema = Type.Object({
  id: Type.String(),
  region_id: Type.String(),
  currency_code: Type.String(),
});

export type UpdateCartRegionProcessInput = Static<typeof UpdateCartRegionSchema>;

export type UpdateCartRegionProcessOutput = Static<
  typeof RetrieveCartResponseSchema
>;
