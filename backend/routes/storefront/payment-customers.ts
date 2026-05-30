import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PAYMENT_CUSTOMER_PROCESS,
  UPDATE_PAYMENT_CUSTOMER_PROCESS,
  CreatePaymentCustomerProcess,
  UpdatePaymentCustomerProcess,
  CreatePaymentCustomerSchema,
  CreatePaymentCustomerResponseSchema,
  UpdatePaymentCustomerSchema,
  UpdatePaymentCustomerResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { requireCustomerFromBearer } from "./customer-from-bearer";

const StorefrontCreatePaymentCustomerBodySchema = Type.Omit(
  CreatePaymentCustomerSchema,
  ["customer_id"],
);
const StorefrontUpdatePaymentCustomerBodySchema = Type.Omit(
  UpdatePaymentCustomerSchema,
  ["id"],
);

export const storefrontPaymentCustomerRoutes = new Elysia({
  prefix: "/payment-customers",
})
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
      const process = getService<CreatePaymentCustomerProcess>(
        CREATE_PAYMENT_CUSTOMER_PROCESS,
      );
      return process.runOperations({
        input: {
          ...(body as StaticDecode<
            typeof StorefrontCreatePaymentCustomerBodySchema
          >),
          customer_id: r.customerId,
        },
      });
    },
    {
      body: StorefrontCreatePaymentCustomerBodySchema,
      response: {
        200: CreatePaymentCustomerResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payment Customers"],
        summary: "Create a payment customer",
        description:
          "Creates a provider payment customer for the authenticated customer",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePaymentCustomerProcess>(
        UPDATE_PAYMENT_CUSTOMER_PROCESS,
      );
      return process.runOperations({
        input: {
          ...(body as StaticDecode<
            typeof StorefrontUpdatePaymentCustomerBodySchema
          >),
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdatePaymentCustomerSchema.properties.id }),
      body: StorefrontUpdatePaymentCustomerBodySchema,
      response: {
        200: UpdatePaymentCustomerResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Payment Customers"],
        summary: "Update a payment customer",
        description: "Updates a provider payment customer profile",
      },
    },
  );
