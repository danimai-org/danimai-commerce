import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_SALES_CHANNEL_PROCESS,
  UPDATE_SALES_CHANNEL_PROCESS,
  DELETE_SALES_CHANNELS_PROCESS,
  PAGINATED_SALES_CHANNELS_PROCESS,
  UPDATE_SALES_CHANNEL_PRODUCTS_PROCESS,
  RETRIEVE_SALES_CHANNEL_PROCESS,
  CreateSalesChannelProcess,
  UpdateSalesChannelProcess,
  DeleteSalesChannelsProcess,
  PaginatedSalesChannelsProcess,
  UpdateSalesChannelProductsProcess,
  RetrieveSalesChannelProcess,
  PaginatedSalesChannelsSchema,
  PaginatedSalesChannelsResponseSchema,
  CreateSalesChannelSchema,
  CreateSalesChannelResponseSchema,
  UpdateSalesChannelSchema,
  UpdateSalesChannelResponseSchema,
  DeleteSalesChannelsSchema,
  UpdateSalesChannelProductsSchema,
  RetrieveSalesChannelSchema,
  RetrieveSalesChannelResponseSchema,
} from "@danimai/sales-channel";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateSalesChannelBodySchema = Type.Omit(UpdateSalesChannelSchema, ["id"]);

export const salesChannelRoutes = new Elysia({ prefix: "/sales-channels" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedSalesChannelsProcess>(
        PAGINATED_SALES_CHANNELS_PROCESS
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedSalesChannelsSchema>,
      });
    },
    {
      query: PaginatedSalesChannelsSchema,
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
    async ({ body }: { body: StaticDecode<typeof CreateSalesChannelSchema> }) => {
      const process = getService<CreateSalesChannelProcess>(CREATE_SALES_CHANNEL_PROCESS);
      return process.runOperations({ input: body });
    },
    {
      body: CreateSalesChannelSchema,
      response: {
        200: CreateSalesChannelResponseSchema,
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
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveSalesChannelProcess>(
        RETRIEVE_SALES_CHANNEL_PROCESS
      );
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrieveSalesChannelSchema.properties.id }),
      response: {
        200: RetrieveSalesChannelResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Retrieve a sales channel",
        description: "Gets a sales channel by ID",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateSalesChannelProcess>(UPDATE_SALES_CHANNEL_PROCESS);
      return process.runOperations({
        input: {
          ...body,
          id: params.id,
        },
      });
    },
    {
      params: Type.Object({ id: UpdateSalesChannelSchema.properties.id }),
      body: UpdateSalesChannelBodySchema,
      response: {
        200: UpdateSalesChannelResponseSchema,
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
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteSalesChannelsSchema,
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
    "/products",
    async ({ body, set }) => {
      const process = getService<UpdateSalesChannelProductsProcess>(
        UPDATE_SALES_CHANNEL_PRODUCTS_PROCESS
      );
      await process.runOperations({ input: body });
      set.status = 204;
      return undefined;
    },
    {
      body: UpdateSalesChannelProductsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Sales Channels"],
        summary: "Update sales channel products",
        description: "Updates product links for sales channels",
      },
    }
  );
