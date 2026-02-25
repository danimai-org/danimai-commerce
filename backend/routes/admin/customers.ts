import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_CUSTOMERS_PROCESS,
  CREATE_CUSTOMERS_PROCESS,
  RETRIEVE_CUSTOMER_PROCESS,
  CREATE_CUSTOMER_ADDRESS_PROCESS,
  LIST_CUSTOMER_ADDRESSES_PROCESS,
  UPDATE_CUSTOMER_ADDRESS_PROCESS,
  DELETE_CUSTOMER_ADDRESS_PROCESS,
  ADD_CUSTOMER_TO_GROUP_PROCESS,
  REMOVE_CUSTOMER_FROM_GROUP_PROCESS,
  PaginatedCustomersProcess,
  CreateCustomersProcess,
  RetrieveCustomerProcess,
  CreateCustomerAddressProcess,
  ListCustomerAddressesProcess,
  UpdateCustomerAddressProcess,
  DeleteCustomerAddressProcess,
  AddCustomerToGroupProcess,
  RemoveCustomerFromGroupProcess,
  PaginatedCustomersSchema,
  CreateCustomersSchema,
  CreateCustomerAddressSchema,
  ListCustomerAddressesSchema,
  UpdateCustomerAddressSchema,
  DeleteCustomerAddressSchema,
  AddCustomerToGroupSchema,
  RemoveCustomerFromGroupSchema,
} from "@danimai/customer";
import { handleProcessError } from "../../utils/error-handler";

const AddCustomerToGroupBodySchema = Type.Object({
  customer_group_id: Type.String(),
});

export const customerRoutes = new Elysia({ prefix: "/customers" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedCustomersProcess>(
        PAGINATED_CUSTOMERS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedCustomersSchema as any,
      detail: {
        tags: ["Customers"],
        summary: "Get paginated customers",
        description: "Gets a paginated list of customers",
      },
    }
  )
  .get(
    "/:id/addresses",
    async ({ params }) => {
      const process = getService<ListCustomerAddressesProcess>(
        LIST_CUSTOMER_ADDRESSES_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { customer_id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Customers"],
        summary: "List customer addresses",
        description: "Lists addresses for a customer",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveCustomerProcess>(RETRIEVE_CUSTOMER_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Customers"],
        summary: "Get a customer by ID",
        description: "Retrieves a single customer by its ID",
      },
    }
  )
  .post(
    "/:id/customer-groups",
    async ({ params, body }) => {
      const process = getService<AddCustomerToGroupProcess>(
        ADD_CUSTOMER_TO_GROUP_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), customer_id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: AddCustomerToGroupBodySchema as any,
      detail: {
        tags: ["Customers"],
        summary: "Add customer to group",
        description: "Associates a customer with a customer group (replaces any existing group)",
      },
    }
  )
  .delete(
    "/:id/customer-groups",
    async ({ params, query }) => {
      const process = getService<RemoveCustomerFromGroupProcess>(
        REMOVE_CUSTOMER_FROM_GROUP_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { customer_id: params.id, customer_group_id: query.customer_group_id };
      await process.runOperations({ input, logger } as any);
      return { success: true };
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      query: RemoveCustomerFromGroupSchema as any,
      detail: {
        tags: ["Customers"],
        summary: "Remove customer from group",
        description: "Removes the customer from one or all customer groups. Use query customer_group_id to remove from a specific group.",
      },
    }
  )
  .post(
    "/:id/addresses",
    async ({ params, body }) => {
      const process = getService<CreateCustomerAddressProcess>(
        CREATE_CUSTOMER_ADDRESS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), customer_id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: CreateCustomerAddressSchema as any,
      detail: {
        tags: ["Customers"],
        summary: "Create customer address",
        description: "Creates an address for a customer",
      },
    }
  )
  .put(
    "/:id/addresses/:addressId",
    async ({ params, body }) => {
      const process = getService<UpdateCustomerAddressProcess>(
        UPDATE_CUSTOMER_ADDRESS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), id: params.addressId, customer_id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String(), addressId: Type.String() }) as any,
      body: UpdateCustomerAddressSchema as any,
      detail: {
        tags: ["Customers"],
        summary: "Update customer address",
        description: "Updates an address for a customer",
      },
    }
  )
  .delete(
    "/:id/addresses/:addressId",
    async ({ params }) => {
      const process = getService<DeleteCustomerAddressProcess>(
        DELETE_CUSTOMER_ADDRESS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { id: params.addressId, customer_id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String(), addressId: Type.String() }) as any,
      detail: {
        tags: ["Customers"],
        summary: "Delete customer address",
        description: "Deletes an address for a customer",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateCustomersProcess>(CREATE_CUSTOMERS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateCustomersSchema as any,
      detail: {
        tags: ["Customers"],
        summary: "Create customer(s)",
        description: "Creates one or more customers",
      },
    }
  );
