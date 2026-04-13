import { Elysia } from "elysia";
import { storefrontProductRoutes } from "./products";

export const storefrontRoutes = new Elysia()
  .group("/storefront", (app) => app.use(storefrontProductRoutes));
