import { Elysia } from "elysia";
import { Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
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
  PaginatedCurrenciesSchema,
  PaginatedCurrenciesResponseSchema,
  ListCurrenciesSchema,
  ListCurrenciesResponseSchema,
  ListAndCountCurrenciesSchema,
  ListAndCountCurrenciesResponseSchema,
  CurrencyResponseSchema,
  ListAvailableCurrenciesSchema,
  ListAvailableCurrenciesResponseSchema,
  CreateCurrenciesSchema,
  CreateCurrenciesResponseSchema,
  UpdateCurrencySchema,
  UpdateCurrencyResponseSchema,
  DeleteCurrenciesSchema,
} from "@danimai/currency";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

const UpdateCurrencyBodySchema = Type.Object({
  tax_inclusive_pricing: Type.Optional(Type.Boolean()),
});

export const currencyRoutes = new Elysia({ prefix: "/currencies" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query: input }) => {
      const process = getService<PaginatedCurrenciesProcess>(
        PAGINATED_CURRENCIES_PROCESS
      );
      return process.runOperations({ input });
    },
    {
      query: PaginatedCurrenciesSchema,
      response: {
        200: PaginatedCurrenciesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "Get paginated active currencies",
        description: "Gets a paginated list of active (enabled) currencies",
      },
    }
  )
  .get(
    "/available",
    async ({ query: input }) => {
      const process = getService<ListAvailableCurrenciesProcess>(
        LIST_AVAILABLE_CURRENCIES_PROCESS
      );
      return process.runOperations({ input });
    },
    {
      query: ListAvailableCurrenciesSchema,
      response: {
        200: ListAvailableCurrenciesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "List available currencies (123 fixed list)",
        description: "Returns the fixed list of 123 ISO currencies with active flag and tax_inclusive_pricing",
      },
    }
  )
  .get(
    "/list",
    async ({ query: input }) => {
      const process = getService<ListCurrenciesProcess>(LIST_CURRENCIES_PROCESS);
      return process.runOperations({ input });
    },
    {
      query: ListCurrenciesSchema,
      response: {
        200: ListCurrenciesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "List currencies (listCurrencies)",
        description: "List currencies with optional filters (code, codes, limit, offset). Danimai-style listCurrencies.",
      },
    }
  )
  .get(
    "/list-and-count",
    async ({ query: input }) => {
      const process = getService<ListAndCountCurrenciesProcess>(
        LIST_AND_COUNT_CURRENCIES_PROCESS
      );
      const [data, count] = await process.runOperations({ input });
      return { data, count };
    },
    {
      query: ListAndCountCurrenciesSchema,
      response: {
        200: ListAndCountCurrenciesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "List and count currencies (listAndCountCurrencies)",
        description: "Returns [data, count]. Danimai-style listAndCountCurrencies.",
      },
    }
  )
  .get(
    "/:id",
    async ({ params }) => {
      const process = getService<RetrieveCurrencyProcess>(RETRIEVE_CURRENCY_PROCESS);
      return process.runOperations({ input: { id: params.id } });
    },
    {
      params: Type.Object({ id: Type.String() }),
      response: {
        200: CurrencyResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "Retrieve currency (retrieveCurrency)",
        description: "Retrieve a single currency by id. Danimai-style retrieveCurrency.",
      },
    }
  )
  .post(
    "/",
    async ({ body: input }) => {
      const process = getService<CreateCurrenciesProcess>(CREATE_CURRENCIES_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: CreateCurrenciesSchema,
      response: {
        200: CreateCurrenciesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "Add currencies to active list",
        description: "Adds currencies from the fixed 123 list to the store (cannot add extra)",
      },
    }
  )
  .put(
    "/:id",
    async ({ params, body }) => {
      const process = getService<UpdateCurrencyProcess>(UPDATE_CURRENCY_PROCESS);
      return process.runOperations({
        input: { ...(body as { tax_inclusive_pricing?: boolean }), id: params.id },
      });
    },
    {
      params: Type.Object({ id: Type.String() }),
      body: UpdateCurrencyBodySchema,
      response: {
        200: UpdateCurrencyResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "Update a currency",
        description: "Updates an active currency (e.g. tax_inclusive_pricing)",
      },
    }
  )
  .delete(
    "/",
    async ({ body: input, set }) => {
      const process = getService<DeleteCurrenciesProcess>(DELETE_CURRENCIES_PROCESS);
      await process.runOperations({ input });
      set.status = 204;
      return undefined;
    },
    {
      body: DeleteCurrenciesSchema,
      response: {
        204: NoContentResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "Remove currencies from active list",
        description: "Soft-deletes currencies (removes from active list)",
      },
    }
  );
