import { Elysia } from "elysia";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_PAYMENTS_PROCESS,
  PaginatedPaymentsProcess,
  PaginatedPaymentsSchema,
  PaginatedPaymentsResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const paymentRoutes = new Elysia({ prefix: "/payments" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedPaymentsProcess>(
        PAGINATED_PAYMENTS_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedPaymentsSchema>,
      });
    },
    {
      query: PaginatedPaymentsSchema,
      response: {
        200: PaginatedPaymentsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Payments"],
        summary: "Get paginated payments",
        description: "Gets a paginated list of payments with optional filters",
      },
    },
  );
