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
  type DeleteTaxRatesProcessInput,
  type DeleteTaxRatesProcessOutput,
  DeleteTaxRatesSchema,
} from "./delete-tax-rates.schema";
import type { Database } from "@danimai/tax/db";

export const DELETE_TAX_RATES_PROCESS = Symbol("DeleteTaxRates");

@Process(DELETE_TAX_RATES_PROCESS)
export class DeleteTaxRatesProcess
  implements ProcessContract<
    typeof DeleteTaxRatesSchema,
    DeleteTaxRatesProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteTaxRatesSchema })
    context: ProcessContextType<typeof DeleteTaxRatesSchema>
  ) {
    const { input } = context;
    const exisingRates = await this.db.selectFrom("tax_rates")
      .where("id", "in", input.tax_rate_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (exisingRates.length !== input.tax_rate_ids.length) {
      throw new ValidationError("Tax rates not found", [
        {
          type: "not_found",
          message: "Tax rates not found", path: "tax_rate_ids"
        },
      ]);
    }
    await this.db
      .deleteFrom("tax_rates")
      .where("id", "in", input.tax_rate_ids)
      .where("deleted_at", "is", null)
      .execute();

    return undefined;
  }

}
