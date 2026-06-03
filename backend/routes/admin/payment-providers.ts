import { Elysia } from "elysia";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PAYMENT_PROVIDER_PROCESS,
  UPDATE_PAYMENT_PROVIDER_PROCESS,
  DELETE_PAYMENT_PROVIDERS_PROCESS,
  PAGINATED_PAYMENT_PROVIDERS_PROCESS,
  CreatePaymentProviderProcess,
  UpdatePaymentProviderProcess,
  DeletePaymentProvidersProcess,
  PaginatedPaymentProvidersProcess,
  CreatePaymentProviderSchema,
  CreatePaymentProviderResponseSchema,
  UpdatePaymentProviderSchema,
  UpdatePaymentProviderResponseSchema,
  DeletePaymentProvidersSchema,
  PaginatedPaymentProvidersSchema,
  PaginatedPaymentProvidersResponseSchema,
} from "@danimai/payment";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdatePaymentProviderBodySchema = Type.Omit(UpdatePaymentProviderSchema, [
  "id",
]);

export const paymentProviderRoutes = new Elysia({
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
        tags: ["Payment Providers"],
        summary: "Get paginated payment providers",
        description:
          "Gets a paginated list of payment providers with optional active filter",
      },
    },
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreatePaymentProviderProcess>(
        CREATE_PAYMENT_PROVIDER_PROCESS,
      );
      return process.runOperations({ input });
    },
    {
      body: CreatePaymentProviderSchema,
      response: {
        200: CreatePaymentProviderResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Payment Providers"],
        summary: "Create a payment provider",
        description: "Creates a new payment provider",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePaymentProviderProcess>(
        UPDATE_PAYMENT_PROVIDER_PROCESS,
      );
      return process.runOperations({
        input: {
          ...(body as StaticDecode<typeof UpdatePaymentProviderBodySchema>),
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdatePaymentProviderSchema.properties.id }),
      body: UpdatePaymentProviderBodySchema,
      response: {
        200: UpdatePaymentProviderResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Payment Providers"],
        summary: "Update a payment provider",
        description:
          "Updates a payment provider including active/inactive toggling",
      },
    },
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeletePaymentProvidersProcess>(
        DELETE_PAYMENT_PROVIDERS_PROCESS,
      );
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeletePaymentProvidersSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Payment Providers"],
        summary: "Delete payment providers",
        description: "Soft-deletes payment providers by their IDs",
      },
    },
  );
