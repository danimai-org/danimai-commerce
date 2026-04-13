import { Elysia } from "elysia";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  STOREFRONT_PAGINATED_PRODUCTS_PROCESS,
  StorefrontPaginatedProductsProcess,
  StorefrontPaginatedProductsResponseSchema,
  StorefrontPaginatedProductsSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const storefrontProductRoutes = new Elysia({ prefix: "/products" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<StorefrontPaginatedProductsProcess>(STOREFRONT_PAGINATED_PRODUCTS_PROCESS);
      return process.runOperations({
        input: query as StaticDecode<typeof StorefrontPaginatedProductsSchema>,
      });
    },
    {
      query: StorefrontPaginatedProductsSchema,
      response: {
        200: StorefrontPaginatedProductsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Products"],
        summary: "Get storefront paginated products",
        description: "Gets paginated products for storefront consumption.",
      },
    }
  );
