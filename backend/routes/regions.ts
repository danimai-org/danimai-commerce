import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_REGIONS_PROCESS,
  CREATE_REGIONS_PROCESS,
  UPDATE_REGIONS_PROCESS,
  DELETE_REGIONS_PROCESS,
  PaginatedRegionsProcess,
  CreateRegionsProcess,
  UpdateRegionsProcess,
  DeleteRegionsProcess,
  type PaginatedRegionsProcessInput,
  type CreateRegionsProcessInput,
  type UpdateRegionProcessInput,
  type DeleteRegionsProcessInput,
  PaginatedRegionsSchema,
} from "@danimai/region";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const regionRoutes = new Elysia({ prefix: "/regions" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedRegionsProcess>(PAGINATED_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedRegionsSchema, query) as PaginatedRegionsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["regions"],
        summary: "Get paginated regions",
        description: "Gets a paginated list of regions",
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
        const process = getService<CreateRegionsProcess>(CREATE_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateRegionsProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["regions"],
        summary: "Create region(s)",
        description: "Creates one or more regions",
        requestBody: {
          content: {
            "application/json": {
              example: {
                regions: [{ name: "South Asia", currency_code: "INR" }],
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
        const process = getService<UpdateRegionsProcess>(UPDATE_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateRegionProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["regions"],
        summary: "Update a region",
        description: "Updates an existing region by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { name: "Updated Name", currency_code: "USD" },
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
        const process = getService<DeleteRegionsProcess>(DELETE_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteRegionsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["regions"],
        summary: "Delete regions",
        description: "Deletes multiple regions by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: { region_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
