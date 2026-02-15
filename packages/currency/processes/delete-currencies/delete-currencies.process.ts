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
  type DeleteCurrenciesProcessInput,
  DeleteCurrenciesSchema,
} from "./delete-currencies.schema";
import type { Database } from "@danimai/currency/db";

export const DELETE_CURRENCIES_PROCESS = Symbol("DeleteCurrencies");

@Process(DELETE_CURRENCIES_PROCESS)
export class DeleteCurrenciesProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeleteCurrenciesSchema })
    context: ProcessContextType<typeof DeleteCurrenciesSchema>
  ): Promise<void> {
    const { input } = context;
    const rows = await this.db
      .selectFrom("currencies")
      .where("id", "in", input.currency_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.currency_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.currency_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Currencies not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Currencies not found: ${missing.join(", ")}`,
            path: "currency_ids",
          },
        ]
      );
    }
    await this.db
      .updateTable("currencies")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.currency_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
