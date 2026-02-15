import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateCurrencyItemInput,
  CreateCurrenciesSchema,
} from "./create-currencies.schema";
import type { Database, Currency } from "@danimai/currency/db";
import { CURRENCIES_LIST } from "../../data/currencies-list";

export const CREATE_CURRENCIES_PROCESS = Symbol("CreateCurrencies");

const ALLOWED_CODES = new Set(CURRENCIES_LIST.map((c) => c.code));

@Process(CREATE_CURRENCIES_PROCESS)
export class CreateCurrenciesProcess
  implements ProcessContract<Currency[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreateCurrenciesSchema })
    context: ProcessContextType<typeof CreateCurrenciesSchema>
  ) {
    const { input } = context;
    const created: Currency[] = [];
    for (const item of input.currencies) {
      if (!ALLOWED_CODES.has(item.code)) {
        throw new ValidationError(
          `Currency code not in allowed list: ${item.code}`,
          [{ type: "invalid", message: `Invalid currency code: ${item.code}`, path: "currencies" }]
        );
      }
      const def = CURRENCIES_LIST.find((c) => c.code === item.code);
      if (!def) continue;

      const existing = await this.db
        .selectFrom("currencies")
        .where("code", "=", item.code)
        .where("deleted_at", "is", null)
        .selectAll()
        .executeTakeFirst();
      if (existing) continue;

      const row = await this.db
        .insertInto("currencies")
        .values({
          code: def.code,
          name: def.name,
          symbol: def.symbol,
          symbol_native: def.symbol_native,
          tax_inclusive_pricing: item.tax_inclusive_pricing ?? false,
        })
        .returningAll()
        .executeTakeFirst();
      if (row) created.push(row);
    }
    return created;
  }
}
