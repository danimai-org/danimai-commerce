import { Elysia } from "elysia";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_PAYMENT_PROVIDERS_PROCESS,
  PaginatedPaymentProvidersProcess,
  PaginatedPaymentProvidersSchema,
  PaginatedPaymentProvidersResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const storefrontPaymentProviderRoutes = new Elysia({
  prefix: "/payment-providers",
})
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedPaymentProvidersProcess>(
        PAGINATED_PAYMENT_PROVIDERS_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedPaymentProvidersSchema>,
      });
    },
    {
      query: PaginatedPaymentProvidersSchema,
      response: {
        200: PaginatedPaymentProvidersResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payment Providers"],
        summary: "Get paginated payment providers",
        description:
          "Gets a paginated list of payment providers with optional active filter",
      },
    },
  );
