import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_SALES_CHANNELS_PROCESS,
  UPDATE_SALES_CHANNELS_PROCESS,
  DELETE_SALES_CHANNELS_PROCESS,
  PAGINATED_SALES_CHANNELS_PROCESS,
  SYNC_PRODUCT_SALES_CHANNELS_PROCESS,
  GET_PRODUCT_SALES_CHANNELS_PROCESS,
  CreateSalesChannelsProcess,
  UpdateSalesChannelsProcess,
  DeleteSalesChannelsProcess,
  PaginatedSalesChannelsProcess,
  SyncProductSalesChannelsProcess,
  GetProductSalesChannelsProcess,
  PaginatedSalesChannelsSchema,
  PaginatedSalesChannelsResponseSchema,
  CreateSalesChannelsSchema,
  CreateSalesChannelsResponseSchema,
  UpdateSalesChannelSchema,
  UpdateSalesChannelsResponseSchema,
  DeleteSalesChannelsSchema,
  SyncProductSalesChannelsSchema,
  GetProductSalesChannelsSchema,
  GetProductSalesChannelsResponseSchema,
} from "@danimai/sales-channel";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateSalesChannelBodySchema = Type.Object({
  name: Type.Optional(Type.String()),
  description: Type.Optional(Type.String()),
});

const SyncProductSalesChannelsBodySchema = Type.Object({
  sales_channel_ids: Type.Array(Type.String()),
});

export const salesChannelRoutes = new Elysia({ prefix: "/sales-channels" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedSalesChannelsProcess>(
        PAGINATED_SALES_CHANNELS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedSalesChannelsSchema as any,
      response: {
        200: PaginatedSalesChannelsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Get paginated sales channels",
        description: "Gets a paginated list of sales channels",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateSalesChannelsProcess>(CREATE_SALES_CHANNELS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateSalesChannelsSchema as any,
      response: {
        200: CreateSalesChannelsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Create sales channel(s)",
        description: "Creates one or more sales channels",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateSalesChannelsProcess>(UPDATE_SALES_CHANNELS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateSalesChannelBodySchema as any,
      response: {
        200: UpdateSalesChannelsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Update a sales channel",
        description: "Updates an existing sales channel by ID",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteSalesChannelsProcess>(DELETE_SALES_CHANNELS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteSalesChannelsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Delete sales channels",
        description: "Deletes multiple sales channels by their IDs",
      },
    }
  )
  .put(
    "/products/:productId/sales-channels",
    async ({ params, body, set }) => {
      const process = getService<SyncProductSalesChannelsProcess>(
        SYNC_PRODUCT_SALES_CHANNELS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { ...(body as Record<string, unknown>), product_id: params.productId };
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ productId: Type.String() }) as any,
      body: SyncProductSalesChannelsBodySchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Sync product sales channels",
        description: "Updates the sales channels for a product",
      },
    }
  )
  .get(
    "/products/:productId/sales-channels",
    async ({ params }) => {
      const process = getService<GetProductSalesChannelsProcess>(
        GET_PRODUCT_SALES_CHANNELS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { product_id: params.productId };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ productId: Type.String() }) as any,
      response: {
        200: GetProductSalesChannelsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Get product sales channels",
        description: "Gets all sales channels for a product",
      },
    }
  );
