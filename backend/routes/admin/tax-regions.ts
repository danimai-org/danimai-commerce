import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_TAX_REGIONS_PROCESS,
  CREATE_TAX_REGIONS_PROCESS,
  UPDATE_TAX_REGIONS_PROCESS,
  DELETE_TAX_REGIONS_PROCESS,
  PaginatedTaxRegionsProcess,
  CreateTaxRegionsProcess,
  UpdateTaxRegionsProcess,
  DeleteTaxRegionsProcess,
  type PaginatedTaxRegionsProcessInput,
  type CreateTaxRegionsProcessInput,
  type UpdateTaxRegionProcessInput,
  type DeleteTaxRegionsProcessInput,
  PaginatedTaxRegionsSchema,
} from "@danimai/tax";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const taxRegionRoutes = new Elysia({ prefix: "/tax-regions" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedTaxRegionsProcess>(
          PAGINATED_TAX_REGIONS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedTaxRegionsSchema, query) as PaginatedTaxRegionsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["tax-regions"],
        summary: "Get paginated tax regions",
        description: "Gets a paginated list of tax regions",
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
        const process = getService<CreateTaxRegionsProcess>(CREATE_TAX_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateTaxRegionsProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["tax-regions"],
        summary: "Create tax region(s)",
        description: "Creates one or more tax regions",
        requestBody: {
          content: {
            "application/json": {
              example: {
                tax_regions: [{ name: "India", tax_provider_id: null }],
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
        const process = getService<UpdateTaxRegionsProcess>(UPDATE_TAX_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateTaxRegionProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["tax-regions"],
        summary: "Update a tax region",
        description: "Updates an existing tax region by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { name: "Updated Name", tax_provider_id: null },
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
        const process = getService<DeleteTaxRegionsProcess>(DELETE_TAX_REGIONS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteTaxRegionsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["tax-regions"],
        summary: "Delete tax regions",
        description: "Deletes multiple tax regions by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: { tax_region_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
