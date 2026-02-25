import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  CREATE_PRODUCT_PROCESS,
  CREATE_PRODUCTS_PROCESS,
  UPDATE_PRODUCT_PROCESS,
  UPDATE_PRODUCTS_PROCESS,
  DELETE_PRODUCTS_PROCESS,
  PAGINATED_PRODUCTS_PROCESS,
  CreateProductProcess,
  CreateProductsProcess,
  UpdateProductProcess,
  UpdateProductsProcess,
  DeleteProductsProcess,
  PaginatedProductsProcess,
  PaginatedProductsSchema,
  CreateProductSchema,
  CreateProductsSchema,
  RETRIEVE_PRODUCT_PROCESS,
  RetrieveProductProcess,
  UpdateProductSchema,
  DeleteProductsSchema,
} from "@danimai/product";
import {
  LIST_SALES_CHANNELS_BY_IDS_PROCESS,
  ListSalesChannelsByIdsProcess,
} from "@danimai/sales-channel";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { Type } from "@sinclair/typebox";

export const productRoutes = new Elysia({ prefix: "/products" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedProductsProcess>(PAGINATED_PRODUCTS_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const cleanedQuery: Record<string, unknown> = Object.fromEntries(
        Object.entries(query).filter(([_, value]) => value !== null && value !== undefined && value !== "")
      );
      if (typeof cleanedQuery.category_ids === "string") {
        cleanedQuery.category_ids = (cleanedQuery.category_ids as string).split(",").map((s) => s.trim()).filter(Boolean);
      }
      const result = await process.runOperations({ input: cleanedQuery as any, logger } as any);
      const allScIds = [...new Set(result.products.flatMap((p) => p.sales_channel_ids))];
      let scMap: Record<string, { id: string; name: string; description: string | null; is_default: boolean; metadata: unknown; created_at: string; updated_at: string; deleted_at: string | null }> = {};
      if (allScIds.length > 0) {
        const listProcess = getService<ListSalesChannelsByIdsProcess>(LIST_SALES_CHANNELS_BY_IDS_PROCESS);
        const channels = await listProcess.runOperations({ input: { ids: allScIds }, logger } as any);
        scMap = Object.fromEntries(channels.map((c) => [c.id, c]));
      }
      const products = result.products.map((p) => {
        const { sales_channel_ids, ...rest } = p;
        const sales_channels = sales_channel_ids.map((id) => scMap[id]).filter(Boolean);
        return { ...rest, sales_channels };
      });
      return { products, count: result.count, offset: result.offset, limit: result.limit };
    },
    {
      query: PaginatedProductsSchema as any,
      detail: {
        tags: ["Products"],
        summary: "Get paginated products",
        description: "Gets a paginated list of products",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveProductProcess>(RETRIEVE_PRODUCT_PROCESS);
      const logger = getService<Logger>(DANIMAI_LOGGER);
      return process.runOperations({ input: { id: params.id }, logger } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      detail: {
        tags: ["Products"],
        summary: "Get a product by ID",
        description: "Retrieves a single product by its ID",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const process = getService<CreateProductProcess>(CREATE_PRODUCT_PROCESS);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: CreateProductSchema as any,
      detail: {
        tags: ["Products"],
        summary: "Create a new product",
        description: "Creates a single product with options, variants, prices, and sales channels (similar to Danimai's createProductsWorkflow)",
      },
    }
  )
  .post(
    "/batch",
    async ({ body: input }) => {
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const process = getService<CreateProductsProcess>(CREATE_PRODUCTS_PROCESS);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: Type.Any() as any,
      detail: {
        tags: ["Products"],
        summary: "Create multiple products",
        description: "Creates multiple products in a single batch operation",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const process = getService<UpdateProductProcess>(UPDATE_PRODUCT_PROCESS);
      return process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
        logger,
      } as any);
    },
    {
      params: Type.Object({ id: Type.String() }) as any,
      body: UpdateProductSchema as any,
      detail: {
        tags: ["Products"],
        summary: "Update a product",
        description: "Updates an existing product by ID",
      },
    }
  )
  .put(
    "/batch",
    async ({ body: input }) => {
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const process = getService<UpdateProductsProcess>(UPDATE_PRODUCTS_PROCESS);
      return process.runOperations({ input, logger } as any);
    },
    {
      body: Type.Any() as any,
      detail: {
        tags: ["Products"],
        summary: "Update multiple products",
        description: "Updates multiple products in a single batch operation",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const logger = getService<Logger>(DANIMAI_LOGGER);
      const process = getService<DeleteProductsProcess>(DELETE_PRODUCTS_PROCESS);
      await process.runOperations({ input, logger } as any);
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteProductsSchema as any,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Products"],
        summary: "Delete products",
        description: "Deletes multiple products by their IDs",
      },
    }
  );
