import { Type, type Static } from "@sinclair/typebox";
import {
  CustomerAuthTokensResponseSchema,
  type CustomerLoginResult,
} from "../login/login.schema";

export const RefreshCustomerTokenSchema = Type.Object({
  refresh_token: Type.String({
    minLength: 1,
    description: "JWT refresh token",
    examples: ["eyJ..."],
  }),
});

export type RefreshCustomerTokenProcessInput = Static<
  typeof RefreshCustomerTokenSchema
>;

export type RefreshCustomerTokenResult = CustomerLoginResult;

export { CustomerAuthTokensResponseSchema };
