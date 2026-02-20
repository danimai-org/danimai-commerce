import { Elysia } from "elysia";
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
  type PaginatedCustomersProcessInput,
  type CreateCustomersProcessInput,
  type RetrieveCustomerProcessInput,
  type CreateCustomerAddressProcessInput,
  type ListCustomerAddressesProcessInput,
  type UpdateCustomerAddressProcessInput,
  type DeleteCustomerAddressProcessInput,
  type AddCustomerToGroupProcessInput,
  type RemoveCustomerFromGroupProcessInput,
  PaginatedCustomersSchema,
  CreateCustomersSchema,
  CreateCustomerAddressSchema,
  ListCustomerAddressesSchema,
  UpdateCustomerAddressSchema,
  DeleteCustomerAddressSchema,
  AddCustomerToGroupSchema,
  RemoveCustomerFromGroupSchema,
} from "@danimai/customer";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const customerRoutes = new Elysia({ prefix: "/customers" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedCustomersProcess>(
          PAGINATED_CUSTOMERS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            PaginatedCustomersSchema,
            query
          ) as PaginatedCustomersProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Get paginated customers",
        description: "Gets a paginated list of customers",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/:id/addresses",
    async ({ params, set }) => {
      try {
        const process = getService<ListCustomerAddressesProcess>(
          LIST_CUSTOMER_ADDRESSES_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { customer_id: params.id } as ListCustomerAddressesProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "List customer addresses",
        description: "Lists addresses for a customer",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveCustomerProcess>(RETRIEVE_CUSTOMER_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { id: params.id } as RetrieveCustomerProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Get a customer by ID",
        description: "Retrieves a single customer by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      },
    }
  )
  .post(
    "/:id/customer-groups",
    async ({ params, body, set }) => {
      try {
        const process = getService<AddCustomerToGroupProcess>(
          ADD_CUSTOMER_TO_GROUP_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(AddCustomerToGroupSchema, {
          ...(body as object),
          customer_id: params.id,
        }) as AddCustomerToGroupProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Add customer to group",
        description: "Associates a customer with a customer group (replaces any existing group)",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: { customer_group_id: { type: "string" } },
            },
          },
        },
      },
    }
  )
  .delete(
    "/:id/customer-groups",
    async ({ params, query, set }) => {
      try {
        const process = getService<RemoveCustomerFromGroupProcess>(
          REMOVE_CUSTOMER_FROM_GROUP_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(RemoveCustomerFromGroupSchema, {
          customer_id: params.id,
          customer_group_id: query.customer_group_id,
        }) as RemoveCustomerFromGroupProcessInput;
        await process.runOperations({ input, logger });
        return { success: true };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Remove customer from group",
        description: "Removes the customer from one or all customer groups. Use query customer_group_id to remove from a specific group.",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "customer_group_id", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .post(
    "/:id/addresses",
    async ({ params, body, set }) => {
      try {
        const process = getService<CreateCustomerAddressProcess>(
          CREATE_CUSTOMER_ADDRESS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(CreateCustomerAddressSchema, {
          ...(body as object),
          customer_id: params.id,
        }) as CreateCustomerAddressProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Create customer address",
        description: "Creates an address for a customer",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
          },
        ],
      },
    }
  )
  .put(
    "/:id/addresses/:addressId",
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdateCustomerAddressProcess>(
          UPDATE_CUSTOMER_ADDRESS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(UpdateCustomerAddressSchema, {
          ...(body as object),
          id: params.addressId,
          customer_id: params.id,
        }) as UpdateCustomerAddressProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Update customer address",
        description: "Updates an address for a customer",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "addressId", in: "path", required: true, schema: { type: "string" } },
        ],
      },
    }
  )
  .delete(
    "/:id/addresses/:addressId",
    async ({ params, set }) => {
      try {
        const process = getService<DeleteCustomerAddressProcess>(
          DELETE_CUSTOMER_ADDRESS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = { id: params.addressId, customer_id: params.id } as DeleteCustomerAddressProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Delete customer address",
        description: "Deletes an address for a customer",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "addressId", in: "path", required: true, schema: { type: "string" } },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateCustomersProcess>(CREATE_CUSTOMERS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(CreateCustomersSchema, body) as CreateCustomersProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customers"],
        summary: "Create customer(s)",
        description: "Creates one or more customers",
        requestBody: {
          content: {
            "application/json": {
              example: {
                customers: [
                  {
                    email: "customer@example.com",
                    first_name: "John",
                    last_name: "Doe",
                    phone: "+1234567890",
                  },
                ],
              },
            },
          },
        },
      },
    }
  );
