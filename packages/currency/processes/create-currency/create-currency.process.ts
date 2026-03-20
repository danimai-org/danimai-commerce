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
  type CreateCurrencyProcessOutput,
  CreateCurrencySchema,
} from "./create-currency.schema";
import type { Database } from "../../db";
import { CURRENCIES_LIST } from "../../data/currencies-list";

export const CREATE_CURRENCY_PROCESS = Symbol("CreateCurrency");

const ALLOWED_CODES = new Set(CURRENCIES_LIST.map((c) => c.code));

@Process(CREATE_CURRENCY_PROCESS)
export class CreateCurrencyProcess
  implements ProcessContract<typeof CreateCurrencySchema, CreateCurrencyProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateCurrencySchema })
    context: ProcessContextType<typeof CreateCurrencySchema>
  ) {
    const { input } = context;

    const currency = await this.db
      .selectFrom("currencies")
      .where("code", "=", input.code)
      .selectAll()
      .executeTakeFirst();

    if (currency) {
      throw new ValidationError("Currency already exists", [{
        type: "already_exists",
        message: "Currency already exists",
        path: "code",
      }]);
    }

    return this.db
      .insertInto("currencies")
      .values({
        ...input,
        id: crypto.randomUUID(),
        symbol: CURRENCIES_LIST.find((c) => c.code === input.code)?.symbol ?? "",
        symbol_native: CURRENCIES_LIST.find((c) => c.code === input.code)?.symbol_native ?? "",
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
