import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_INVENTORY_ITEMS_PROCESS,
  PAGINATED_INVENTORY_LEVELS_PROCESS,
  CREATE_INVENTORY_ITEMS_PROCESS,
  GET_INVENTORY_ITEM_PROCESS,
  UPDATE_INVENTORY_ITEM_PROCESS,
  SET_INVENTORY_LEVEL_PROCESS,
  DELETE_INVENTORY_LEVEL_PROCESS,
  PaginatedInventoryItemsProcess,
  PaginatedInventoryLevelsProcess,
  CreateInventoryItemsProcess,
  GetInventoryItemProcess,
  UpdateInventoryItemProcess,
  SetInventoryLevelProcess,
  DeleteInventoryLevelProcess,
  type GetInventoryItemProcessInput,
  type PaginatedInventoryItemsProcessInput,
  type CreateInventoryItemsProcessInput,
  type UpdateInventoryItemProcessInput,
  type SetInventoryLevelProcessInput,
  type DeleteInventoryLevelProcessInput,
  PaginatedInventoryItemsSchema,
  PaginatedInventoryLevelsSchema,
  GetInventoryItemSchema,
  SetInventoryLevelSchema,
  DeleteInventoryLevelSchema,
  UpdateInventoryItemSchema,
} from "@danimai/inventory";
import {
  LIST_STOCK_LOCATIONS_BY_IDS_PROCESS,
  ListStockLocationsByIdsProcess,
  type StockLocationWithAddress,
} from "@danimai/stock-location";
import {
  LIST_PRODUCT_VARIANTS_BY_SKU_PROCESS,
  ListProductVariantsBySkuProcess,
} from "@danimai/product";
import { handleProcessError } from "../../utils/error-handler";
import Value from "typebox/value";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .post(
    "/items",
    async ({ body, set }) => {
      try {
        const process = getService<CreateInventoryItemsProcess>(
          CREATE_INVENTORY_ITEMS_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateInventoryItemsProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Create inventory item(s)",
        description: "Creates one or more inventory items",
        requestBody: {
          content: {
            "application/json": {
              example: {
                inventory_items: [
                  { sku: "SKU-001", requires_shipping: true },
                ],
              },
            },
          },
        },
      },
    }
  )
  .get(
    "/items/:id",
    async ({ params, set }) => {
      try {
        const process = getService<GetInventoryItemProcess>(
          GET_INVENTORY_ITEM_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(GetInventoryItemSchema, {
          id: params.id,
        }) as GetInventoryItemProcessInput;
        const result = await process.runOperations({ input, logger });
        if (!result) return result;
        const locationIds = [
          ...new Set(result.levels.map((l) => l.location_id)),
        ];
        let locationMap: Record<string, StockLocationWithAddress> = {};
        if (locationIds.length > 0) {
          const listLocations = getService<ListStockLocationsByIdsProcess>(
            LIST_STOCK_LOCATIONS_BY_IDS_PROCESS
          );
          const locations = await listLocations.runOperations({
            input: { ids: locationIds },
            logger,
          });
          locationMap = Object.fromEntries(
            locations.map((loc) => [loc.id, loc])
          );
        }
        const levelsWithLocation = result.levels.map((level) => ({
          ...level,
          location: locationMap[level.location_id] ?? null,
        }));
        let associated_variants: unknown[] = [];
        let product_summaries: Record<string, { id: string; title: string | null; thumbnail: string | null }> = {};
        if (result.item.sku) {
          try {
            const listVariants = getService<ListProductVariantsBySkuProcess>(
              LIST_PRODUCT_VARIANTS_BY_SKU_PROCESS
            );
            const variantResult = await listVariants.runOperations({
              input: { sku: result.item.sku },
              logger,
            });
            associated_variants = variantResult.variants;
            product_summaries = variantResult.product_summaries;
          } catch {
            // leave empty on error
          }
        }
        return {
          item: result.item,
          levels: levelsWithLocation,
          reservations: result.reservations,
          associated_variants,
          product_summaries,
        };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Get inventory item by ID",
        description: "Gets a single inventory item with its levels and reservations",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
      },
    }
  )
  .put(
    "/items/:id",
    async ({ params, body, set }) => {
      try {
        const process = getService<UpdateInventoryItemProcess>(
          UPDATE_INVENTORY_ITEM_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(UpdateInventoryItemSchema, {
          id: params.id,
          ...body,
        }) as UpdateInventoryItemProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Update inventory item",
        description: "Updates an inventory item by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          content: {
            "application/json": {
              schema: {
                sku: { type: "string", nullable: true },
                requires_shipping: { type: "boolean" },
              },
            },
          },
        },
      },
    }
  )
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
  .post(
    "/levels",
    async ({ body, set }) => {
      try {
        const process = getService<SetInventoryLevelProcess>(
          SET_INVENTORY_LEVEL_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(SetInventoryLevelSchema, body) as SetInventoryLevelProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Set inventory level",
        description: "Create or update stock quantity for an inventory item at a location",
        requestBody: {
          content: {
            "application/json": {
              schema: {
                inventory_item_id: { type: "string" },
                location_id: { type: "string" },
                stocked_quantity: { type: "number" },
              },
            },
          },
        },
      },
    }
  )
  .delete(
    "/levels/:id",
    async ({ params, set }) => {
      try {
        const process = getService<DeleteInventoryLevelProcess>(
          DELETE_INVENTORY_LEVEL_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(DeleteInventoryLevelSchema, { id: params.id }) as DeleteInventoryLevelProcessInput;
        await process.runOperations({ input, logger });
        return { success: true };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["inventory"],
        summary: "Delete inventory level",
        description: "Soft-deletes an inventory level by ID",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
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
