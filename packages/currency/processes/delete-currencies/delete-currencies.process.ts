import {
  InjectDB,
  InjectLogger,
  NotFoundError,
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
import type { Database } from "../../db";

export const DELETE_CURRENCIES_PROCESS = Symbol("DeleteCurrencies");

@Process(DELETE_CURRENCIES_PROCESS)
export class DeleteCurrenciesProcess implements ProcessContract<typeof DeleteCurrenciesSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteCurrenciesSchema })
    context: ProcessContextType<typeof DeleteCurrenciesSchema>
  ): Promise<void> {
    const { input } = context;
    const rows = await this.db
      .selectFrom("currencies")
      .where("id", "in", input.ids ?? [])
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();


    if (rows.length !== input.ids?.length) {
      throw new NotFoundError(
        `Currencies not found`
      );
    }

    await this.db
      .deleteFrom("currencies")
      .where("id", "in", input.ids)
      .execute();
  }
}
