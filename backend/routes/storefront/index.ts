import { Elysia } from "elysia";
import { storefrontAuthRoutes } from "./auth";
import { storefrontCartRoutes } from "./carts";
import { storefrontCustomerRoutes } from "./customers";
import { storefrontOrderRoutes } from "./orders";
import { storefrontProductRoutes } from "./products";

export const storefrontRoutes = new Elysia().group("/storefront", (app) =>
  app
    .use(storefrontProductRoutes)
    .use(storefrontAuthRoutes)
    .use(storefrontCustomerRoutes)
    .use(storefrontCartRoutes)
    .use(storefrontOrderRoutes)
);
