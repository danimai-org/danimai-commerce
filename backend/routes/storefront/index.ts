import { Elysia } from "elysia";
import { storefrontAuthRoutes } from "./auth";
import { storefrontCartRoutes } from "./carts";
import { storefrontCustomerRoutes } from "./customer-addresses";
import { storefrontOrderRoutes } from "./orders";
import { storefrontProductRoutes } from "./products";
import { storefrontPaymentProviderRoutes } from "./payment-providers";
import { storefrontPaymentRoutes } from "./payments";
import { storefrontPaymentCustomerRoutes } from "./payment-customers";
import { storefrontPaymentTransactionRoutes } from "./payment-transactions";
import { storefrontStripeConfigRoutes } from "./stripe-config";
import { storefrontStripeWebhookRoutes } from "./stripe-webhook";

export const storefrontRoutes = new Elysia().group("/storefront", (app) =>
  app
    .use(storefrontProductRoutes)
    .use(storefrontPaymentProviderRoutes)
    .use(storefrontPaymentRoutes)
    .use(storefrontPaymentCustomerRoutes)
    .use(storefrontPaymentTransactionRoutes)
    .use(storefrontStripeConfigRoutes)
    .use(storefrontStripeWebhookRoutes)
    .use(storefrontAuthRoutes)
    .use(storefrontCustomerRoutes)
    .use(storefrontCartRoutes)
    .use(storefrontOrderRoutes),
);
