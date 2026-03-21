import { InjectDB, Process, ProcessContext, type ProcessContextType, type ProcessContract } from "@danimai/core";
import { Kysely } from "kysely";
import { CURRENCIES_LIST } from "../../data/currencies-list";
import type { Database } from "../../db";
import {
  AvailableCurrenciesSchema,
  type AvailableCurrenciesProcessOutput,
} from "./available-currencies.schema";

export const AVAILABLE_CURRENCIES_PROCESS = Symbol("AvailableCurrencies");

@Process(AVAILABLE_CURRENCIES_PROCESS)
export class AvailableCurrenciesProcess
  implements ProcessContract<typeof AvailableCurrenciesSchema, AvailableCurrenciesProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) {}

  async runOperations(
    @ProcessContext({ schema: AvailableCurrenciesSchema })
    context: ProcessContextType<typeof AvailableCurrenciesSchema>
  ): Promise<AvailableCurrenciesProcessOutput> {
    const { input } = context;
    const page = input.page ?? 1;
    const limit = input.limit ?? 10;
    const search = (input.search ?? "").trim().toLowerCase();

    const actives = await this.db
      .selectFrom("currencies")
      .where("deleted_at", "is", null)
      .select(["code", "id", "tax_inclusive_pricing"])
      .execute();

    const byCode = new Map(actives.map((r) => [r.code, r]));

    let merged = CURRENCIES_LIST.map((def) => {
      const row = byCode.get(def.code);
      return {
        code: def.code,
        name: def.name,
        symbol: def.symbol,
        symbol_native: def.symbol_native,
        active: !!row,
        ...(row ? { id: row.id } : {}),
        tax_inclusive_pricing: row?.tax_inclusive_pricing ?? false,
      };
    });

    if (search) {
      merged = merged.filter(
        (c) => c.code.toLowerCase().includes(search) || c.name.toLowerCase().includes(search)
      );
    }

    const total = merged.length;
    const offset = (page - 1) * limit;
    const data = merged.slice(offset, offset + limit);
    const total_pages = Math.ceil(total / limit) || 1;

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        total_pages,
        has_next_page: page < total_pages,
        has_previous_page: page > 1,
      },
    };
  }
}
