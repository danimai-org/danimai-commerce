import {
  resolveStripePublishableKey,
  resolveStripeSecretKey,
} from "@danimai/core";
import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";

const StripeConfigResponseSchema = Type.Object({
  publishable_key: Type.String(),
});

const StripeConfigErrorSchema = Type.Object({
  message: Type.String(),
});

export const storefrontStripeConfigRoutes = new Elysia({
  prefix: "/stripe-config",
}).get(
  "/",
  ({ set }) => {
    try {
      const secretKey = resolveStripeSecretKey(
        Bun.env.STRIPE_KEY ?? "",
        Bun.env.STRIPE_SECRET_KEY ?? "",
        Bun.env.STRIPE_PUBLISHABLE_KEY ?? "",
      );
      const publishableKey = resolveStripePublishableKey(
        secretKey,
        Bun.env.STRIPE_PUBLISHABLE_KEY ?? "",
      );
      return { publishable_key: publishableKey };
    } catch (error) {
      set.status = 503;
      return {
        message:
          error instanceof Error
            ? error.message
            : "Stripe publishable key is not configured",
      };
    }
  },
  {
    response: {
      200: StripeConfigResponseSchema,
      503: StripeConfigErrorSchema,
    },
    detail: {
      tags: ["Storefront Stripe"],
      summary: "Stripe publishable configuration",
      description:
        "Returns the Stripe publishable key for client-side Payment Element initialization",
    },
  },
);
