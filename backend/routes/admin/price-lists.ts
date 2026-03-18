import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  CREATE_PRICE_LIST_PROCESS,
  DELETE_PRICE_LISTS_PROCESS,
  PAGINATED_PRICE_LISTS_PROCESS,
  RETRIEVE_PRICE_LIST_PROCESS,
  UPDATE_PRICE_LIST_PROCESS,
  CreatePriceListProcess,
  DeletePriceListsProcess,
  PaginatedPriceListsProcess,
  RetrievePriceListProcess,
  UpdatePriceListProcess,
  CreatePriceListSchema,
  CreatePriceListResponseSchema,
  DeletePriceListsSchema,
  PaginatedPriceListsResponseSchema,
  PaginatedPriceListsSchema,
  PriceListResponseSchema,
  RetrievePriceListSchema,
  UpdatePriceListResponseSchema,
  UpdatePriceListSchema,
} from "@danimai/pricing";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdatePriceListBodySchema = Type.Omit(UpdatePriceListSchema, ["id"]);

export const priceListRoutes = new Elysia({ prefix: "/price-lists" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedPriceListsProcess>(
        PAGINATED_PRICE_LISTS_PROCESS,
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedPriceListsSchema>,
      });
    },
    {
      query: PaginatedPriceListsSchema,
      response: {
        200: PaginatedPriceListsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Price Lists"],
        summary: "Get paginated price lists",
        description: "Gets a paginated list of price lists",
      },
    },
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrievePriceListProcess>(
        RETRIEVE_PRICE_LIST_PROCESS,
      );
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: RetrievePriceListSchema.properties.id }),
      response: {
        200: PriceListResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Price Lists"],
        summary: "Retrieve price list",
        description: "Retrieves a single price list by id",
      },
    },
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreatePriceListProcess>(CREATE_PRICE_LIST_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreatePriceListSchema,
      response: {
        200: CreatePriceListResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Price Lists"],
        summary: "Create price list",
        description: "Creates a price list",
      },
    },
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdatePriceListProcess>(UPDATE_PRICE_LIST_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
    },
    {
      params: Type.Object({ id: UpdatePriceListSchema.properties.id }),
      body: UpdatePriceListBodySchema,
      response: {
        200: UpdatePriceListResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Price Lists"],
        summary: "Update price list",
        description: "Updates a price list by id",
      },
    },
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeletePriceListsProcess>(DELETE_PRICE_LISTS_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeletePriceListsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Price Lists"],
        summary: "Delete price lists",
        description: "Soft-deletes price lists by IDs",
      },
    },
  );
