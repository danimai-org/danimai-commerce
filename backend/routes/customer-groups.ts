import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_CUSTOMER_GROUPS_PROCESS,
  CREATE_CUSTOMER_GROUPS_PROCESS,
  PaginatedCustomerGroupsProcess,
  CreateCustomerGroupsProcess,
  type PaginatedCustomerGroupsProcessInput,
  type CreateCustomerGroupsProcessInput,
  PaginatedCustomerGroupsSchema,
  CreateCustomerGroupsSchema,
} from "@danimai/customer";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const customerGroupRoutes = new Elysia({ prefix: "/customer-groups" })
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
  );
