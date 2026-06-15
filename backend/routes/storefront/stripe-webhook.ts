import { DANIMAI_STRIPE, getService } from "@danimai/core";
import {
  SYNC_PAYMENT_TRANSACTION_FROM_STRIPE_WEBHOOK_PROCESS,
  SyncPaymentTransactionFromStripeWebhookProcess,
  SyncPaymentTransactionFromStripeWebhookResponseSchema,
} from "@danimai/payment";
import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import type Stripe from "stripe";
import { handleProcessError } from "../../utils/error-handler";
import { InternalErrorResponseSchema } from "../../utils/response-schemas";

const StripeWebhookErrorSchema = Type.Object({
  message: Type.String(),
});

function mapStripeEvent(
  event: Stripe.Event,
): {
  event_type: string;
  payment_transaction_id?: string;
  payment_intent_id?: string;
  session_id?: string;
} {
  switch (event.type) {
    case "payment_intent.succeeded":
    case "payment_intent.payment_failed":
    case "payment_intent.canceled": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      return {
        event_type: event.type,
        payment_transaction_id:
          paymentIntent.metadata?.payment_transaction_id,
        payment_intent_id: paymentIntent.id,
      };
    }
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      return {
        event_type: event.type,
        payment_transaction_id: session.metadata?.payment_transaction_id,
        session_id: session.id,
        payment_intent_id: paymentIntentId,
      };
    }
    default:
      return { event_type: event.type };
  }
}

export const storefrontStripeWebhookRoutes = new Elysia({
  prefix: "/stripe",
})
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/webhook",
    async ({ request, headers, set }) => {
      const webhookSecret = Bun.env.STRIPE_WEBHOOK_SECRET?.trim();
      if (!webhookSecret) {
        set.status = 503;
        return { message: "Stripe webhook secret is not configured" };
      }

      const signature = headers["stripe-signature"];
      if (!signature) {
        set.status = 400;
        return { message: "Missing Stripe signature" };
      }

      const rawBody = await request.text();
      const stripe = getService<Stripe>(DANIMAI_STRIPE);

      let event: Stripe.Event;
      try {
        event = stripe.webhooks.constructEvent(
          rawBody,
          signature,
          webhookSecret,
        );
      } catch (error) {
        set.status = 400;
        return {
          message:
            error instanceof Error
              ? error.message
              : "Invalid Stripe webhook signature",
        };
      }

      const process = getService<SyncPaymentTransactionFromStripeWebhookProcess>(
        SYNC_PAYMENT_TRANSACTION_FROM_STRIPE_WEBHOOK_PROCESS,
      );

      return process.runOperations({
        input: mapStripeEvent(event),
      });
    },
    {
      parse: "none",
      response: {
        200: SyncPaymentTransactionFromStripeWebhookResponseSchema,
        400: StripeWebhookErrorSchema,
        500: InternalErrorResponseSchema,
        503: StripeWebhookErrorSchema,
      },
      detail: {
        tags: ["Storefront Stripe"],
        summary: "Stripe webhook",
        description:
          "Receives Stripe payment events and syncs payment transaction status",
      },
    },
  );
