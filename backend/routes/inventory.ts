import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_INVENTORY_ITEMS_PROCESS,
  PAGINATED_INVENTORY_LEVELS_PROCESS,
  PaginatedInventoryItemsProcess,
  type PaginatedInventoryItemsProcessInput,
  PaginatedInventoryItemsSchema,
  PaginatedInventoryLevelsProcess,
  type PaginatedInventoryLevelsProcessInput,
  PaginatedInventoryLevelsSchema,
} from "@danimai/inventory";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .get(
    "/items",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedInventoryItemsProcess>(
          PAGINATED_INVENTORY_ITEMS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            PaginatedInventoryItemsSchema,
            query
          ) as PaginatedInventoryItemsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Get paginated inventory items",
        description: "Gets a paginated list of inventory items",
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
    "/levels",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedInventoryLevelsProcess>(
          PAGINATED_INVENTORY_LEVELS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(
            PaginatedInventoryLevelsSchema,
            query
          ) as PaginatedInventoryLevelsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Get paginated inventory levels",
        description: "Gets a paginated list of inventory levels by location",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  );
