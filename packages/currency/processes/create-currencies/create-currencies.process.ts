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
        .selectAll()
        .executeTakeFirst();
      
      if (existing) {
        // If currency exists and is not deleted, skip it
        if (existing.deleted_at === null) {
          continue;
        }
        // If currency exists but is soft-deleted, restore it
        const restored = await this.db
          .updateTable("currencies")
          .set({
            deleted_at: null,
            tax_inclusive_pricing: item.tax_inclusive_pricing ?? false,
            updated_at: new Date(),
          })
          .where("code", "=", item.code)
          .returningAll()
          .executeTakeFirst();
        if (restored) created.push(restored);
        continue;
      }

      // Currency doesn't exist, insert it
      try {
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
      } catch (error: any) {
        // Handle race condition: if another request inserted the same currency
        // between our check and insert, catch the duplicate key error
        if (error?.code === "23505" || error?.message?.includes("duplicate key")) {
          // Currency was inserted by another request, skip it
          continue;
        }
        throw error;
      }
    }
    return created;
  }
}
