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
  type DeleteTaxProvidersProcessInput,
  DeleteTaxProvidersSchema,
} from "./delete-tax-providers.schema";
import type { Database } from "@danimai/tax/db";

export const DELETE_TAX_PROVIDERS_PROCESS = Symbol("DeleteTaxProviders");

@Process(DELETE_TAX_PROVIDERS_PROCESS)
export class DeleteTaxProvidersProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteTaxProvidersSchema })
    context: ProcessContextType<typeof DeleteTaxProvidersSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateTaxProviders(input);
    await this.deleteTaxProviders(input);
  }

  async validateTaxProviders(input: DeleteTaxProvidersProcessInput) {
    const rows = await this.db
      .selectFrom("tax_providers")
      .where("id", "in", input.tax_provider_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.tax_provider_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.tax_provider_ids.filter((id) => !found.includes(id));
      throw new ValidationError(
        `Tax providers not found: ${missing.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Tax providers not found: ${missing.join(", ")}`,
            path: "tax_provider_ids",
          },
        ]
      );
    }
    return rows;
  }

  async deleteTaxProviders(input: DeleteTaxProvidersProcessInput) {
    this.logger.info("Deleting tax providers", {
      tax_provider_ids: input.tax_provider_ids,
    });
    await this.db
      .updateTable("tax_providers")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.tax_provider_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
