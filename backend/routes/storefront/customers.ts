import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_CUSTOMER_ADDRESS_PROCESS,
  type CreateCustomerAddressProcess,
  CreateCustomerAddressSchema,
  CreateCustomerAddressResponseSchema,
  DELETE_CUSTOMER_ADDRESS_PROCESS,
  type DeleteCustomerAddressProcess,
  DeleteCustomerAddressResponseSchema,
  LIST_CUSTOMER_ADDRESSES_PROCESS,
  type ListCustomerAddressesProcess,
  ListCustomerAddressesResponseSchema,
  UPDATE_CUSTOMER_ADDRESS_PROCESS,
  type UpdateCustomerAddressProcess,
  UpdateCustomerAddressSchema,
  UpdateCustomerAddressResponseSchema,
} from "@danimai/customer";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { requireCustomerFromBearer } from "./customer-from-bearer";

const StorefrontCreateCustomerAddressBodySchema = Type.Omit(
  CreateCustomerAddressSchema,
  ["customer_id"]
);

const StorefrontUpdateCustomerAddressBodySchema = Type.Omit(
  UpdateCustomerAddressSchema,
  ["id", "customer_id"]
);

export const storefrontCustomerRoutes = new Elysia({ prefix: "/customers" })
  .use(bearer())
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/me/addresses",
    async ({ bearer, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<ListCustomerAddressesProcess>(
        LIST_CUSTOMER_ADDRESSES_PROCESS
      );
      return process.runOperations({
        input: { customer_id: r.customerId },
      });
    },
    {
      response: {
        200: ListCustomerAddressesResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Customers"],
        summary: "List my addresses",
        description: "List addresses for the authenticated customer.",
      },
    }
  )
  .post(
    "/me/addresses",
    async ({ bearer, body, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<CreateCustomerAddressProcess>(
        CREATE_CUSTOMER_ADDRESS_PROCESS
      );
      return process.runOperations({
        input: {
          ...body,
          customer_id: r.customerId,
        },
      });
    },
    {
      body: StorefrontCreateCustomerAddressBodySchema,
      response: {
        200: CreateCustomerAddressResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Customers"],
        summary: "Create address",
        description: "Create an address for the authenticated customer.",
      },
    }
  )
  .put(
    "/me/addresses/:addressId",
    async ({ bearer, params, body, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<UpdateCustomerAddressProcess>(
        UPDATE_CUSTOMER_ADDRESS_PROCESS
      );
      return process.runOperations({
        input: {
          ...body,
          id: params.addressId,
          customer_id: r.customerId,
        },
      });
    },
    {
      params: Type.Object({
        addressId: Type.String({ format: "uuid" }),
      }),
      body: StorefrontUpdateCustomerAddressBodySchema,
      response: {
        200: UpdateCustomerAddressResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Customers"],
        summary: "Update address",
        description: "Update an address belonging to the authenticated customer.",
      },
    }
  )
  .delete(
    "/me/addresses/:addressId",
    async ({ bearer, params, set }) => {
      const r = await requireCustomerFromBearer(bearer);
      if (!r.ok) {
        set.status = r.status;
        return r.body;
      }
      const process = getService<DeleteCustomerAddressProcess>(
        DELETE_CUSTOMER_ADDRESS_PROCESS
      );
      return process.runOperations({
        input: { id: params.addressId, customer_id: r.customerId },
      });
    },
    {
      params: Type.Object({
        addressId: Type.String({ format: "uuid" }),
      }),
      response: {
        200: DeleteCustomerAddressResponseSchema,
        401: UnauthorizedResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Storefront Customers"],
        summary: "Delete address",
        description: "Delete an address belonging to the authenticated customer.",
      },
    }
  );
