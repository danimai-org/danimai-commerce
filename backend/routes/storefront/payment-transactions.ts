import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PAYMENT_TRANSACTION_PROCESS,
  UPDATE_PAYMENT_TRANSACTION_PROCESS,
  CreatePaymentTransactionProcess,
  UpdatePaymentTransactionProcess,
  CreatePaymentTransactionSchema,
  CreatePaymentTransactionResponseSchema,
  UpdatePaymentTransactionSchema,
  UpdatePaymentTransactionResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const StorefrontUpdatePaymentTransactionBodySchema = Type.Omit(
  UpdatePaymentTransactionSchema,
  ["id"],
);

export const storefrontPaymentTransactionRoutes = new Elysia({
  prefix: "/payment-transactions",
})
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreatePaymentTransactionProcess>(
        CREATE_PAYMENT_TRANSACTION_PROCESS,
      );
      return process.runOperations({ input });
    },
    {
      body: CreatePaymentTransactionSchema,
      response: {
        200: CreatePaymentTransactionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payment Transactions"],
        summary: "Create a payment transaction",
        description:
          "Creates a payment transaction; with success_url and cancel_url returns Stripe Checkout redirect URL",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePaymentTransactionProcess>(
        UPDATE_PAYMENT_TRANSACTION_PROCESS,
      );
      return process.runOperations({
        input: {
          ...(body as StaticDecode<
            typeof StorefrontUpdatePaymentTransactionBodySchema
          >),
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({
        id: UpdatePaymentTransactionSchema.properties.id,
      }),
      body: StorefrontUpdatePaymentTransactionBodySchema,
      response: {
        200: UpdatePaymentTransactionResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payment Transactions"],
        summary: "Update a payment transaction",
        description: "Updates a payment transaction with payment intent data",
      },
    },
  );
