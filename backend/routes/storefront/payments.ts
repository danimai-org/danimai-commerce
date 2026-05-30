import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PAYMENT_PROCESS,
  UPDATE_PAYMENT_PROCESS,
  CreatePaymentProcess,
  UpdatePaymentProcess,
  CreatePaymentSchema,
  CreatePaymentResponseSchema,
  UpdatePaymentSchema,
  UpdatePaymentResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { requireCustomerFromBearer } from "./customer-from-bearer";

const StorefrontCreatePaymentBodySchema = Type.Omit(CreatePaymentSchema, [
  "customer_id",
]);
const StorefrontUpdatePaymentBodySchema = Type.Omit(UpdatePaymentSchema, [
  "id",
]);

export const storefrontPaymentRoutes = new Elysia({ prefix: "/payments" })
  .use(bearer())
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/",
    async ({ bearer, body, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<CreatePaymentProcess>(CREATE_PAYMENT_PROCESS);
      return process.runOperations({
        input: {
          ...(body as StaticDecode<typeof StorefrontCreatePaymentBodySchema>),
          customer_id: r.customerId,
        },
      });
    },
    {
      body: StorefrontCreatePaymentBodySchema,
      response: {
        200: CreatePaymentResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payments"],
        summary: "Create a payment",
        description:
          "Creates a payment for the authenticated customer and order",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePaymentProcess>(UPDATE_PAYMENT_PROCESS);
      return process.runOperations({
        input: {
          ...(body as StaticDecode<typeof StorefrontUpdatePaymentBodySchema>),
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdatePaymentSchema.properties.id }),
      body: StorefrontUpdatePaymentBodySchema,
      response: {
        200: UpdatePaymentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payments"],
        summary: "Update a payment",
        description: "Updates payment status or transaction references",
      },
    },
  );
