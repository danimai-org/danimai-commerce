import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  paginationResponse,
} from "@danimai/core";
import { Kysely } from "kysely";
import type {
  ListAvailableCurrenciesProcessInput,
  AvailableCurrencyItem,
} from "./list-available-currencies.schema";
import { ListAvailableCurrenciesSchema } from "./list-available-currencies.schema";
import type { Database } from "@danimai/currency/db";
import { CURRENCIES_LIST } from "../../data/currencies-list";

export const LIST_AVAILABLE_CURRENCIES_PROCESS = Symbol(
  "ListAvailableCurrencies"
);

@Process(LIST_AVAILABLE_CURRENCIES_PROCESS)
export class ListAvailableCurrenciesProcess
  implements ProcessContract<{ data: AvailableCurrencyItem[]; pagination: any }> {
  constructor(@InjectDB() private readonly db: Kysely<Database>) {}

  async runOperations(
    @ProcessContext({ schema: ListAvailableCurrenciesSchema })
    context: ProcessContextType<typeof ListAvailableCurrenciesSchema>
  ) {
    const { input } = context;
    const { page = 1, limit = 50, search = "" } =
      input as ListAvailableCurrenciesProcessInput;

    const activeRows = await this.db
      .selectFrom("currencies")
      .where("deleted_at", "is", null)
      .select(["id", "code", "tax_inclusive_pricing"])
      .execute();
    const activeByCode = new Map(
      activeRows.map((r) => [
        r.code,
        { id: r.id, tax_inclusive_pricing: r.tax_inclusive_pricing },
      ])
    );

    const searchLower = search.trim().toLowerCase();
    let filtered = CURRENCIES_LIST;
    if (searchLower) {
      filtered = CURRENCIES_LIST.filter(
        (c) =>
          c.code.toLowerCase().includes(searchLower) ||
          c.name.toLowerCase().includes(searchLower)
      );
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const pageItems = filtered.slice(offset, offset + limit);

    const data: AvailableCurrencyItem[] = pageItems.map((c) => {
      const active = activeByCode.get(c.code);
      return {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        symbol_native: c.symbol_native,
        active: !!active,
        id: active?.id,
        tax_inclusive_pricing: active?.tax_inclusive_pricing ?? false,
      };
    });

    return paginationResponse(data, total, {
      page,
      limit,
      sorting_field: "code",
      sorting_direction: "asc" as const,
    });
  }
}
