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
  PaginatedInventoryItemsSchema,
  CreateInventoryItemsSchema,
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
import { Type } from "@sinclair/typebox";

export const inventoryRoutes = new Elysia({ prefix: "/inventory" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .post(
    "/items",
    async ({ body: input }) => {
      const process = getService<CreateInventoryItemsProcess>(
        CREATE_INVENTORY_ITEMS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateInventoryItemsSchema as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { id: params.id };
      const result = await process.runOperations({ input, logger } as any);
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
        } as any);
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
          } as any);
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
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
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
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { id: params.id, ...(body as Record<string, unknown>) };
      return process.runOperations({ input, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateInventoryItemSchema as any,
      detail: {
        tags: ["Inventory"],
        summary: "Update inventory item",
        description: "Updates an inventory item by ID",
      },
    }
  )
  .get(
    "/items",
    async ({ query: input }) => {
      const process = getService<PaginatedInventoryItemsProcess>(
        PAGINATED_INVENTORY_ITEMS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedInventoryItemsSchema as any,
      detail: {
        tags: ["Inventory"],
        summary: "Get paginated inventory items",
        description: "Gets a paginated list of inventory items",
      },
    }
  )
  .post(
    "/levels",
    async ({ body: input }) => {
      const process = getService<SetInventoryLevelProcess>(
        SET_INVENTORY_LEVEL_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: SetInventoryLevelSchema as any,
      detail: {
        tags: ["Inventory"],
        summary: "Set inventory level",
        description: "Create or update stock quantity for an inventory item at a location",
      },
    }
  )
  .delete(
    "/levels/:id",
    async ({ params }) => {
      const process = getService<DeleteInventoryLevelProcess>(
        DELETE_INVENTORY_LEVEL_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const input = { id: params.id };
      await process.runOperations({ input, logger } as any);
      return { success: true };
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Inventory"],
        summary: "Delete inventory level",
        description: "Soft-deletes an inventory level by ID",
      },
    }
  )
  .get(
    "/levels",
    async ({ query: input }) => {
      const process = getService<PaginatedInventoryLevelsProcess>(
        PAGINATED_INVENTORY_LEVELS_PROCESS
      );
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input, logger } as any);
    },
    {
      query: PaginatedInventoryLevelsSchema as any,
      detail: {
        tags: ["Inventory"],
        summary: "Get paginated inventory levels",
        description: "Gets a paginated list of inventory levels by location",
      },
    }
  );
