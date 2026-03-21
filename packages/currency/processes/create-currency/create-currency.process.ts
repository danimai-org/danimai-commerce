import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type CreateCurrencyProcessOutput,
  CreateCurrenciesSchema,
} from "./create-currency.schema";
import type { Database } from "../../db";
import { CURRENCIES_LIST } from "../../data/currencies-list";

export const CREATE_CURRENCY_PROCESS = Symbol("CreateCurrency");

const ALLOWED_CODES = new Set(CURRENCIES_LIST.map((c) => c.code));
const DEF_BY_CODE = new Map(CURRENCIES_LIST.map((c) => [c.code, c]));

@Process(CREATE_CURRENCY_PROCESS)
export class CreateCurrencyProcess
  implements ProcessContract<typeof CreateCurrenciesSchema, CreateCurrencyProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateCurrenciesSchema })
    context: ProcessContextType<typeof CreateCurrenciesSchema>
  ) {
    const { input } = context;

    return this.db.transaction().execute(async (trx) => {
      const data = [];
      for (const item of input.currencies) {
        const code = item.code.trim().toUpperCase();
        if (!ALLOWED_CODES.has(code)) {
          throw new ValidationError(`Currency code ${code} is not in the allowed catalog`, [{
            type: "invalid",
            message: `Currency code ${code} is not in the allowed catalog`,
            path: "currencies",
          }]);
        }

        const def = DEF_BY_CODE.get(code);
        if (!def) {
          throw new ValidationError(`Unknown currency code ${code}`, [{
            type: "invalid",
            message: `Unknown currency code ${code}`,
            path: "currencies",
          }]);
        }

        const existing = await trx
          .selectFrom("currencies")
          .where("code", "=", code)
          .selectAll()
          .executeTakeFirst();

        if (existing) {
          throw new ValidationError("Currency already exists", [{
            type: "already_exists",
            message: `Currency ${code} already exists`,
            path: "currencies",
          }]);
        }

        const row = await trx
          .insertInto("currencies")
          .values({
            id: crypto.randomUUID(),
            code: def.code,
            name: def.name,
            symbol: def.symbol,
            symbol_native: def.symbol_native,
            tax_inclusive_pricing: item.tax_inclusive_pricing,
            metadata: null,
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        data.push(row);
      }

      return { data };
    });
  }
}
