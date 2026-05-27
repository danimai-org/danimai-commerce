import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  STOREFRONT_PAGINATED_PRODUCTS_PROCESS,
  StorefrontPaginatedProductsProcess,
  StorefrontPaginatedProductsResponseSchema,
  StorefrontPaginatedProductsSchema,
  STOREFRONT_RETRIEVE_PRODUCT_PROCESS,
  StorefrontRetrieveProductProcess,
  StorefrontRetrieveProductResponseSchema,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NotFoundResponseSchema,
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
  )
  .get(
    "/:handle",
    async ({ params }) => {
      const process = getService<StorefrontRetrieveProductProcess>(
        STOREFRONT_RETRIEVE_PRODUCT_PROCESS,
      );
      return process.runOperations({
        input: { handle: params.handle },
      });
    },
    {
      params: Type.Object({ handle: Type.String() }),
      response: {
        200: StorefrontRetrieveProductResponseSchema,
        404: NotFoundResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Products"],
        summary: "Get storefront product by handle",
        description:
          "Returns a product with ordered media gallery and variants for the product detail page.",
      },
    }
  );
