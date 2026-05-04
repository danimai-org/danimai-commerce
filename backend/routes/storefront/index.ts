import { Elysia } from "elysia";
import { storefrontAuthRoutes } from "./auth";
import { storefrontCustomerRoutes } from "./customers";
import { storefrontProductRoutes } from "./products";

export const storefrontRoutes = new Elysia().group("/storefront", (app) =>
  app
    .use(storefrontProductRoutes)
    .use(storefrontAuthRoutes)
    .use(storefrontCustomerRoutes)
);
