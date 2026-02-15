import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_SALES_CHANNELS_PROCESS,
  UPDATE_SALES_CHANNELS_PROCESS,
  DELETE_SALES_CHANNELS_PROCESS,
  PAGINATED_SALES_CHANNELS_PROCESS,
  CreateSalesChannelsProcess,
  UpdateSalesChannelsProcess,
  DeleteSalesChannelsProcess,
  PaginatedSalesChannelsProcess,
  type CreateSalesChannelsProcessInput,
  type UpdateSalesChannelProcessInput,
  type DeleteSalesChannelsProcessInput,
  type PaginatedSalesChannelsProcessInput,
  PaginatedSalesChannelsSchema,
} from "@danimai/sales-channel";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const salesChannelRoutes = new Elysia({ prefix: "/sales-channels" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedSalesChannelsProcess>(
          PAGINATED_SALES_CHANNELS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedSalesChannelsSchema, query) as PaginatedSalesChannelsProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["sales-channels"],
        summary: "Get paginated sales channels",
        description: "Gets a paginated list of sales channels",
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
        const process = getService<CreateSalesChannelsProcess>(CREATE_SALES_CHANNELS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateSalesChannelsProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["sales-channels"],
        summary: "Create sales channel(s)",
        description: "Creates one or more sales channels",
        requestBody: {
          content: {
            "application/json": {
              example: {
                sales_channels: [
                  { name: "Default Sales Channel", description: "Created by Danimai", is_default: true },
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
        const process = getService<UpdateSalesChannelsProcess>(UPDATE_SALES_CHANNELS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateSalesChannelProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["sales-channels"],
        summary: "Update a sales channel",
        description: "Updates an existing sales channel by ID",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { name: "Updated Name", description: "Updated description" },
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
        const process = getService<DeleteSalesChannelsProcess>(DELETE_SALES_CHANNELS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteSalesChannelsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["sales-channels"],
        summary: "Delete sales channels",
        description: "Deletes multiple sales channels by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: { sales_channel_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
