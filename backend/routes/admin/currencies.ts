import { Elysia } from "elysia";
import { Type, type Static, type StaticDecode } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  PAGINATED_CURRENCIES_PROCESS,
  AVAILABLE_CURRENCIES_PROCESS,
  RETRIEVE_CURRENCY_PROCESS,
  CREATE_CURRENCY_PROCESS,
  UPDATE_CURRENCY_PROCESS,
  DELETE_CURRENCIES_PROCESS,
  PaginatedCurrenciesProcess,
  AvailableCurrenciesProcess,
  RetrieveCurrencyProcess,
  CreateCurrencyProcess,
  UpdateCurrencyProcess,
  DeleteCurrenciesProcess,
  PaginatedCurrenciesSchema,
  PaginatedCurrenciesResponseSchema,
  AvailableCurrenciesSchema,
  AvailableCurrenciesResponseSchema,
  RetrieveCurrencySchema,
  CurrencyResponseSchema,
  CreateCurrenciesSchema,
  CreateCurrenciesResponseSchema,
  UpdateCurrencyPatchBodySchema,
  UpdateCurrencyResponseSchema,
  DeleteCurrenciesSchema,
} from "@danimai/currency";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";

function asPaginatedInput(
  q: unknown
): StaticDecode<typeof PaginatedCurrenciesSchema> {
  return q as StaticDecode<typeof PaginatedCurrenciesSchema>;
}

function asAvailableInput(
  q: unknown
): StaticDecode<typeof AvailableCurrenciesSchema> {
  return q as StaticDecode<typeof AvailableCurrenciesSchema>;
}

export const currencyRoutes = new Elysia({ prefix: "/currencies" })
  .onError(({ error, set }) => handleProcessError(error, set))
  .get(
    "/",
    async ({ query }) => {
      const process = getService<PaginatedCurrenciesProcess>(
        PAGINATED_CURRENCIES_PROCESS
      );
      return process.runOperations({ input: asPaginatedInput(query) });
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
    async ({ query }) => {
      const process = getService<AvailableCurrenciesProcess>(AVAILABLE_CURRENCIES_PROCESS);
      return process.runOperations({ input: asAvailableInput(query) });
    },
    {
      query: AvailableCurrenciesSchema,
      response: {
        200: AvailableCurrenciesResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Currencies"],
        summary: "List available ISO currencies",
        description:
          "Fixed catalog merged with active store currencies (active flag, optional id). Paginated.",
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
      params: Type.Object({ id: RetrieveCurrencySchema.properties.id }),
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
      const process = getService<CreateCurrencyProcess>(CREATE_CURRENCY_PROCESS);
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
      const result = await process.runOperations({
        input: { ...(body as Record<string, unknown>), id: params.id },
      });
      return result as Static<typeof UpdateCurrencyResponseSchema>;
    },
    {
      params: Type.Object({ id: RetrieveCurrencySchema.properties.id }),
      body: UpdateCurrencyPatchBodySchema,
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
