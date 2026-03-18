import { Elysia } from "elysia";
import { StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_INVENTORY_ITEMS_PROCESS,
  PAGINATED_INVENTORY_LEVELS_PROCESS,
  CREATE_INVENTORY_ITEMS_PROCESS,
  GET_INVENTORY_ITEM_PROCESS,
  UPDATE_INVENTORY_ITEM_PROCESS,
  SET_INVENTORY_LEVEL_PROCESS,
  DELETE_INVENTORY_LEVEL_PROCESS,
  DELETE_INVENTORY_ITEMS_PROCESS,
  PaginatedInventoryItemsProcess,
  PaginatedInventoryLevelsProcess,
  CreateInventoryItemsProcess,
  GetInventoryItemProcess,
  UpdateInventoryItemProcess,
  SetInventoryLevelProcess,
  DeleteInventoryLevelProcess,
  DeleteInventoryItemsProcess,
  PaginatedInventoryItemsSchema,
  PaginatedInventoryItemsResponseSchema,
  CreateInventoryItemsSchema,
  CreateInventoryItemsResponseSchema,
  GetInventoryItemSchema,
  GetInventoryItemResponseSchema,
  UpdateInventoryItemSchema,
  UpdateInventoryItemResponseSchema,
  PaginatedInventoryLevelsSchema,
  PaginatedInventoryLevelsResponseSchema,
  SetInventoryLevelSchema,
  SetInventoryLevelResponseSchema,
  DeleteInventoryLevelSchema,
  DeleteInventoryItemsSchema,
} from "@danimai/inventory";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateInventoryItemBodySchema = Type.Omit(UpdateInventoryItemSchema, ["id"]);

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/items",
    async ({ body: input }) => {
      const process = getService<CreateInventoryItemsProcess>(
        CREATE_INVENTORY_ITEMS_PROCESS
      );
      return process.runOperations({ input });
    },
    {
      body: CreateInventoryItemsSchema,
      response: {
        200: CreateInventoryItemsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Create inventory item(s)",
        description: "Creates one or more inventory items",
      },
    }
  )
  .get(
    "/items/:id",
    async ({ params }) => {
      const process = getService<GetInventoryItemProcess>(
        GET_INVENTORY_ITEM_PROCESS
      );
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: GetInventoryItemSchema.properties.id }),
      response: {
        200: GetInventoryItemResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Get inventory item by ID",
        description: "Gets a single inventory item with its levels and reservations",
      },
    }
  )
  .put(
    "/items/:id",
    async ({ params, body }) => {
      const process = getService<UpdateInventoryItemProcess>(
        UPDATE_INVENTORY_ITEM_PROCESS
      );
      const input = { ...(body as Record<string, unknown>), id: params.id };
      return process.runOperations({ input });
    },
    {
      params: Type.Object({ id: UpdateInventoryItemSchema.properties.id }),
      body: UpdateInventoryItemBodySchema,
      response: {
        200: UpdateInventoryItemResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Update inventory item",
        description: "Updates an inventory item by ID",
      },
    }
  )
  .get(
    "/items",
    async ({ query }) => {
      const process = getService<PaginatedInventoryItemsProcess>(
        PAGINATED_INVENTORY_ITEMS_PROCESS
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedInventoryItemsSchema>,
      });
    },
    {
      query: PaginatedInventoryItemsSchema,
      response: {
        200: PaginatedInventoryItemsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Get paginated inventory items",
        description: "Gets a paginated list of inventory items",
      },
    }
  )
  .delete(
    "/items",
    async ({ body: input, set }) => {
      const process = getService<DeleteInventoryItemsProcess>(
        DELETE_INVENTORY_ITEMS_PROCESS
      );
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteInventoryItemsSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Delete inventory items",
        description: "Soft-deletes one or more inventory items by ID",
      },
    }
  )
  .post(
    "/levels",
    async ({ body: input }) => {
      const process = getService<SetInventoryLevelProcess>(
        SET_INVENTORY_LEVEL_PROCESS
      );
      return process.runOperations({ input });
    },
    {
      body: SetInventoryLevelSchema,
      response: {
        200: SetInventoryLevelResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Set inventory level",
        description: "Create or update stock quantity for an inventory item at a location",
      },
    }
  )
  .delete(
    "/levels/:id",
    async ({ params, set }) => {
      const process = getService<DeleteInventoryLevelProcess>(
        DELETE_INVENTORY_LEVEL_PROCESS
      );
      const input = { id: params.id };
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      params: Type.Object({ id: DeleteInventoryLevelSchema.properties.id }),
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Delete inventory level",
        description: "Soft-deletes an inventory level by ID",
      },
    }
  )
  .get(
    "/levels",
    async ({ query }) => {
      const process = getService<PaginatedInventoryLevelsProcess>(
        PAGINATED_INVENTORY_LEVELS_PROCESS
      );
      return process.runOperations({
        input: query as StaticDecode<typeof PaginatedInventoryLevelsSchema>,
      });
    },
    {
      query: PaginatedInventoryLevelsSchema,
      response: {
        200: PaginatedInventoryLevelsResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Inventory"],
        summary: "Get paginated inventory levels",
        description: "Gets a paginated list of inventory levels by location",
      },
    }
  );
