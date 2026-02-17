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
  CreateProductSchema,
  type CreateProductProcessInput,
  type CreateProductsProcessInput,
  type UpdateProductProcessInput,
  type UpdateProductsProcessInput,
  type DeleteProductsProcessInput,
  type PaginatedProductsProcessInput,
  PaginatedProductsSchema,
  RETRIEVE_PRODUCT_PROCESS,
  RetrieveProductProcess,
  type RetrieveProductProcessInput,
} from "@danimai/product";
import {
  LIST_SALES_CHANNELS_BY_IDS_PROCESS,
  ListSalesChannelsByIdsProcess,
} from "@danimai/sales-channel";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const productRoutes = new Elysia({ prefix: "/products" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedProductsProcess>(PAGINATED_PRODUCTS_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        // Clean query parameters: remove empty strings, null, or undefined values
        const cleanedQuery = Object.fromEntries(
          Object.entries(query).filter(([_, value]) => value !== null && value !== undefined && value !== "")
        );
        const result = await process.runOperations({ input: Value.Convert(PaginatedProductsSchema, cleanedQuery) as PaginatedProductsProcessInput, logger });
        const allScIds = [...new Set(result.products.flatMap((p) => p.sales_channel_ids))];
        let scMap: Record<string, { id: string; name: string; description: string | null; is_default: boolean; metadata: unknown; created_at: string; updated_at: string; deleted_at: string | null }> = {};
        if (allScIds.length > 0) {
          const listProcess = getService<ListSalesChannelsByIdsProcess>(LIST_SALES_CHANNELS_BY_IDS_PROCESS);
          const channels = await listProcess.runOperations({ input: { ids: allScIds } as { ids: string[] }, logger });
          scMap = Object.fromEntries(channels.map((c) => [c.id, c]));
        }
        const products = result.products.map((p) => {
          const { sales_channel_ids, ...rest } = p;
          const sales_channels = sales_channel_ids.map((id) => scMap[id]).filter(Boolean);
          return { ...rest, sales_channels };
        });
        return { products, count: result.count, offset: result.offset, limit: result.limit };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Get paginated products",
        description: "Gets a paginated list of products",
        parameters: [
          {
            name: "page",
            in: "query",
            required: false,
            schema: { type: "number" },
            example: 1,
          },
          {
            name: "limit",
            in: "query",
            required: false,
            schema: { type: "number" },
            example: 10,
          },
          {
            name: "sorting_field",
            in: "query",
            required: false,
            schema: { type: "string" },
            example: "created_at",
          },
          {
            name: "sorting_direction",
            in: "query",
            required: false,
            schema: { type: "string" },
            example: "desc",
          },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveProductProcess>(RETRIEVE_PRODUCT_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({ input: { id: params.id } as RetrieveProductProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Get a product by ID",
        description: "Retrieves a single product by its ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<CreateProductProcess>(CREATE_PRODUCT_PROCESS);
        const input = Value.Convert(CreateProductSchema, body) as CreateProductProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Create a new product",
        description: "Creates a single product with options, variants, prices, and sales channels (similar to Danimai's createProductsWorkflow)",
        requestBody: {
          content: {
            "application/json": {
              example: {
                title: "Shirt",
                handle: "shirt",
                subtitle: "Comfortable cotton shirt",
                description: "A classic cotton shirt perfect for everyday wear",
                is_giftcard: false,
                discountable: true,
                status: "draft",
                thumbnail: "https://example.com/images/shirt.jpg",
                category_id: "550e8400-e29b-41d4-a716-446655440000",
                options: [
                  {
                    title: "Size",
                    values: ["S", "M", "L"],
                  },
                ],
                variants: [
                  {
                    title: "Small Shirt",
                    sku: "SMALLSHIRT",
                    options: {
                      Size: "S",
                    },
                    prices: [
                      {
                        amount: 10,
                        currency_code: "usd",
                      },
                    ],
                    manage_inventory: true,
                  },
                ],
                sales_channels: [
                  {
                    id: "sc_123",
                  },
                ],
                shipping_profile_id: "sp_123",
                metadata: {
                  material: "cotton",
                },
              },
            },
          },
        },
      },
    }
  )
  .post(
    "/batch",
    async ({ body, set }) => {
      try {
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<CreateProductsProcess>(CREATE_PRODUCTS_PROCESS);
        const result = await process.runOperations({ input: body as CreateProductsProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Create multiple products",
        description: "Creates multiple products with options, variants, prices, and sales channels in a single batch operation (similar to Danimai's createProductsWorkflow)",
        requestBody: {
          content: {
            "application/json": {
              example: {
                products: [
                  {
                    title: "Shirt",
                    handle: "shirt",
                    subtitle: "Comfortable cotton shirt",
                    description: "A classic cotton shirt perfect for everyday wear",
                    status: "draft",
                    options: [
                      {
                        title: "Size",
                        values: ["S", "M", "L"],
                      },
                    ],
                    variants: [
                      {
                        title: "Small Shirt",
                        sku: "SMALLSHIRT",
                        options: {
                          Size: "S",
                        },
                        prices: [
                          {
                            amount: 10,
                            currency_code: "usd",
                          },
                        ],
                        manage_inventory: true,
                      },
                    ],
                    sales_channels: [
                      {
                        id: "sc_123",
                      },
                    ],
                    shipping_profile_id: "sp_123",
                  },
                ],
                additional_data: {
                  erp_id: "123",
                },
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
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<UpdateProductProcess>(UPDATE_PRODUCT_PROCESS);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateProductProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Update a product",
        description: "Updates an existing product by ID",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string" },
            example: "550e8400-e29b-41d4-a716-446655440000",
          },
        ],
        requestBody: {
          content: {
            "application/json": {
              example: {
                title: "Updated Product Title",
                subtitle: "Updated subtitle",
                status: "published",
                discountable: true,
              },
            },
          },
        },
      },
    }
  )
  .put(
    "/batch",
    async ({ body, set }) => {
      try {
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<UpdateProductsProcess>(UPDATE_PRODUCTS_PROCESS);
        const result = await process.runOperations({ input: body as UpdateProductsProcessInput, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Update multiple products",
        description: "Updates multiple products in a single batch operation",
        requestBody: {
          content: {
            "application/json": {
              example: {
                products: [
                  {
                    id: "550e8400-e29b-41d4-a716-446655440000",
                    title: "Updated T-Shirt",
                    status: "published",
                  },
                  {
                    id: "660e8400-e29b-41d4-a716-446655440001",
                    title: "Updated Jeans",
                    status: "published",
                  },
                ],
              },
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
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const process = getService<DeleteProductsProcess>(DELETE_PRODUCTS_PROCESS);
        const input = body as unknown as DeleteProductsProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["products"],
        summary: "Delete products",
        description: "Deletes multiple products by their IDs",
        requestBody: {
          content: {
            "application/json": {
              example: {
                product_ids: [
                  "550e8400-e29b-41d4-a716-446655440000",
                  "660e8400-e29b-41d4-a716-446655440001",
                ],
              },
            },
          },
        },
      },
    }
  );
