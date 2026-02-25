import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_CUSTOMER_GROUPS_PROCESS,
  CREATE_CUSTOMER_GROUPS_PROCESS,
  RETRIEVE_CUSTOMER_GROUP_PROCESS,
  UPDATE_CUSTOMER_GROUP_PROCESS,
  DELETE_CUSTOMER_GROUPS_PROCESS,
  LIST_CUSTOMERS_IN_GROUP_PROCESS,
  PaginatedCustomerGroupsProcess,
  CreateCustomerGroupsProcess,
  RetrieveCustomerGroupProcess,
  UpdateCustomerGroupProcess,
  DeleteCustomerGroupsProcess,
  ListCustomersInGroupProcess,
  type PaginatedCustomerGroupsProcessInput,
  type CreateCustomerGroupsProcessInput,
  type UpdateCustomerGroupProcessInput,
  type DeleteCustomerGroupsProcessInput,
  type ListCustomersInGroupProcessInput,
  PaginatedCustomerGroupsSchema,
  CreateCustomerGroupsSchema,
  RetrieveCustomerGroupSchema,
  UpdateCustomerGroupSchema,
  DeleteCustomerGroupsSchema,
  ListCustomersInGroupSchema,
} from "@danimai/customer";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const customerGroupRoutes = new Elysia({ prefix: "/customer-groups" })
  .get(
    "/:id/customers",
    async ({ params, query, set }) => {
      try {
        const process = getService<ListCustomersInGroupProcess>(
          LIST_CUSTOMERS_IN_GROUP_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(ListCustomersInGroupSchema, {
          ...query,
          customer_group_id: params.id,
        }) as ListCustomersInGroupProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customer-groups"],
        summary: "List customers in a group",
        description: "Gets a paginated list of customers in a customer group",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveCustomerGroupProcess>(
          RETRIEVE_CUSTOMER_GROUP_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(RetrieveCustomerGroupSchema, {
          id: params.id,
        });
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customer-groups"],
        summary: "Get a customer group",
        description: "Retrieves a customer group by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    }
  )
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedCustomerGroupsProcess>(
          PAGINATED_CUSTOMER_GROUPS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            PaginatedCustomerGroupsSchema,
            query
          ) as PaginatedCustomerGroupsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customer-groups"],
        summary: "Get paginated customer groups",
        description: "Gets a paginated list of customer groups",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateCustomerGroupsProcess>(CREATE_CUSTOMER_GROUPS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(CreateCustomerGroupsSchema, body) as CreateCustomerGroupsProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customer-groups"],
        summary: "Create customer group(s)",
        description: "Creates one or more customer groups",
        requestBody: {
          content: {
            "application/json": {
              example: {
                customer_groups: [
                  {
                    name: "VIP Customers",
                  },
                ],
              },
            },
          },
        },
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdateCustomerGroupProcess>(
          UPDATE_CUSTOMER_GROUP_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(UpdateCustomerGroupSchema, {
          ...(body as object),
          id: params.id,
        }) as UpdateCustomerGroupProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customer-groups"],
        summary: "Update a customer group",
        description: "Updates a customer group by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              schema: { name: { type: "string" } },
            },
          },
        },
      },
    }
  )
  .delete(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<DeleteCustomerGroupsProcess>(
          DELETE_CUSTOMER_GROUPS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(DeleteCustomerGroupsSchema, body) as DeleteCustomerGroupsProcessInput;
        await process.runOperations({ input, logger });
        return { success: true };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["customer-groups"],
        summary: "Delete customer group(s)",
        description: "Deletes one or more customer groups",
        requestBody: {
          content: {
            "application/json": {
              schema: { customer_group_ids: { type: "array", items: { type: "string" } } },
            },
          },
        },
      },
    }
  );
