import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  PAGINATED_CURRENCIES_PROCESS,
  LIST_CURRENCIES_PROCESS,
  LIST_AND_COUNT_CURRENCIES_PROCESS,
  RETRIEVE_CURRENCY_PROCESS,
  LIST_AVAILABLE_CURRENCIES_PROCESS,
  CREATE_CURRENCIES_PROCESS,
  UPDATE_CURRENCY_PROCESS,
  DELETE_CURRENCIES_PROCESS,
  PaginatedCurrenciesProcess,
  ListCurrenciesProcess,
  ListAndCountCurrenciesProcess,
  RetrieveCurrencyProcess,
  ListAvailableCurrenciesProcess,
  CreateCurrenciesProcess,
  UpdateCurrencyProcess,
  DeleteCurrenciesProcess,
  type CreateCurrenciesProcessInput,
  type UpdateCurrencyProcessInput,
  type DeleteCurrenciesProcessInput,
  type PaginatedCurrenciesProcessInput,
  type ListCurrenciesProcessInput,
  type ListAndCountCurrenciesProcessInput,
  type ListAvailableCurrenciesProcessInput,
  PaginatedCurrenciesSchema,
  ListCurrenciesSchema,
  ListAndCountCurrenciesSchema,
  RetrieveCurrencySchema,
  ListAvailableCurrenciesSchema,
  CreateCurrenciesSchema,
  UpdateCurrencySchema,
  DeleteCurrenciesSchema,
} from "@danimai/currency";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

export const currencyRoutes = new Elysia({ prefix: "/currencies" })
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const process = getService<PaginatedCurrenciesProcess>(
          PAGINATED_CURRENCIES_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(PaginatedCurrenciesSchema, query) as PaginatedCurrenciesProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "Get paginated active currencies",
        description: "Gets a paginated list of active (enabled) currencies",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/available",
    async ({ query, set }) => {
      try {
        const process = getService<ListAvailableCurrenciesProcess>(
          LIST_AVAILABLE_CURRENCIES_PROCESS
        );
        const result = await process.runOperations({
          input: Value.Convert(ListAvailableCurrenciesSchema, query) as ListAvailableCurrenciesProcessInput,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "List available currencies (123 fixed list)",
        description: "Returns the fixed list of 123 ISO currencies with active flag and tax_inclusive_pricing",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "search", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/list",
    async ({ query, set }) => {
      try {
        const process = getService<ListCurrenciesProcess>(LIST_CURRENCIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: Value.Convert(ListCurrenciesSchema, query) as ListCurrenciesProcessInput,
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "List currencies (listCurrencies)",
        description: "List currencies with optional filters (code, codes, limit, offset). Danimai-style listCurrencies.",
        parameters: [
          { name: "code", in: "query", required: false, schema: { type: "string" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "offset", in: "query", required: false, schema: { type: "number" } },
        ],
      },
    }
  )
  .get(
    "/list-and-count",
    async ({ query, set }) => {
      try {
        const process = getService<ListAndCountCurrenciesProcess>(
          LIST_AND_COUNT_CURRENCIES_PROCESS
        );
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const [data, count] = await process.runOperations({
          input: Value.Convert(ListAndCountCurrenciesSchema, query) as ListAndCountCurrenciesProcessInput,
          logger,
        });
        return { data, count };
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "List and count currencies (listAndCountCurrencies)",
        description: "Returns [data, count]. Danimai-style listAndCountCurrencies.",
        parameters: [
          { name: "page", in: "query", required: false, schema: { type: "number" } },
          { name: "limit", in: "query", required: false, schema: { type: "number" } },
          { name: "sorting_field", in: "query", required: false, schema: { type: "string" } },
          { name: "sorting_direction", in: "query", required: false, schema: { type: "string" } },
          { name: "code", in: "query", required: false, schema: { type: "string" } },
        ],
      },
    }
  )
  .get(
    "/:id",
    async ({ params, set }) => {
      try {
        const process = getService<RetrieveCurrencyProcess>(RETRIEVE_CURRENCY_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "Retrieve currency (retrieveCurrency)",
        description: "Retrieve a single currency by id. Danimai-style retrieveCurrency.",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
      },
    }
  )
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const process = getService<CreateCurrenciesProcess>(CREATE_CURRENCIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as CreateCurrenciesProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "Add currencies to active list",
        description: "Adds currencies from the fixed 123 list to the store (cannot add extra)",
        requestBody: {
          content: {
            "application/json": {
              example: {
                currencies: [
                  { code: "USD", tax_inclusive_pricing: false },
                  { code: "EUR", tax_inclusive_pricing: true },
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
        const process = getService<UpdateCurrencyProcess>(UPDATE_CURRENCY_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const result = await process.runOperations({
          input: { ...(body as Omit<UpdateCurrencyProcessInput, "id">), id: params.id },
          logger,
        });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "Update a currency",
        description: "Updates an active currency (e.g. tax_inclusive_pricing)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          content: {
            "application/json": {
              example: { tax_inclusive_pricing: true },
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
        const process = getService<DeleteCurrenciesProcess>(DELETE_CURRENCIES_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = body as unknown as DeleteCurrenciesProcessInput;
        await process.runOperations({ input, logger });
        return new Response(null, { status: 204 });
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["currencies"],
        summary: "Remove currencies from active list",
        description: "Soft-deletes currencies (removes from active list)",
        requestBody: {
          content: {
            "application/json": {
              example: { currency_ids: ["550e8400-e29b-41d4-a716-446655440000"] },
            },
          },
        },
      },
    }
  );
