import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService, PaginationSchema } from "@danimai/core";
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
  PaginatedCustomerGroupsSchema,
  CreateCustomerGroupsSchema,
  RetrieveCustomerGroupSchema,
  DeleteCustomerGroupsSchema,
} from "@danimai/customer";
import { handleProcessError } from "../../utils/error-handler";

const UpdateCustomerGroupBodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  metadata: Type.Optional(
    Type.Record(Type.String(), Type.Union([Type.String(), Type.Number(), Type.Boolean(), Type.Null()]))
  ),
});

export const customerGroupRoutes = new Elysia({ prefix: "/customer-groups" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/:id/customers",
    async ({ params, query }) => {
      const process = getService<ListCustomersInGroupProcess>(
        LIST_CUSTOMERS_IN_GROUP_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...query, customer_group_id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      query: PaginationSchema as any,
      detail: {
        tags: ["Customer Groups"],
        summary: "List customers in a group",
        description: "Gets a paginated list of customers in a customer group",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveCustomerGroupProcess>(
        RETRIEVE_CUSTOMER_GROUP_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: RetrieveCustomerGroupSchema as any,
      detail: {
        tags: ["Customer Groups"],
        summary: "Get a customer group",
        description: "Retrieves a customer group by ID",
      },
    }
  )
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedCustomerGroupsProcess>(
        PAGINATED_CUSTOMER_GROUPS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedCustomerGroupsSchema as any,
      detail: {
        tags: ["Customer Groups"],
        summary: "Get paginated customer groups",
        description: "Gets a paginated list of customer groups",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateCustomerGroupsProcess>(CREATE_CUSTOMER_GROUPS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateCustomerGroupsSchema as any,
      detail: {
        tags: ["Customer Groups"],
        summary: "Create customer group(s)",
        description: "Creates one or more customer groups",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateCustomerGroupProcess>(
        UPDATE_CUSTOMER_GROUP_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), id: params.id };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateCustomerGroupBodySchema as any,
      detail: {
        tags: ["Customer Groups"],
        summary: "Update a customer group",
        description: "Updates a customer group by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input }) => {
      const process = getService<DeleteCustomerGroupsProcess>(
        DELETE_CUSTOMER_GROUPS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      return { success: true };
    },
    {
      body: DeleteCustomerGroupsSchema as any,
      detail: {
        tags: ["Customer Groups"],
        summary: "Delete customer group(s)",
        description: "Deletes one or more customer groups",
      },
    }
  );
