import { Elysia } from "elysia";
import { type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_PAYMENT_TRANSACTIONS_PROCESS,
  PaginatedPaymentTransactionsProcess,
  PaginatedPaymentTransactionsSchema,
  PaginatedPaymentTransactionsResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

export const paymentTransactionRoutes = new Elysia({
  prefix: "/payment-transactions",
})
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedPaymentTransactionsProcess>(
        PAGINATED_PAYMENT_TRANSACTIONS_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<
          typeof PaginatedPaymentTransactionsSchema
        >,
      });
    },
    {
      query: PaginatedPaymentTransactionsSchema,
      response: {
        200: PaginatedPaymentTransactionsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Payment Transactions"],
        summary: "Get paginated payment transactions",
        description:
          "Gets a paginated list of payment transactions with optional filters",
      },
    },
  );
