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
  type UpdateTaxProviderProcessInput,
  UpdateTaxProviderSchema,
} from "./update-tax-providers.schema";
import type { Database, TaxProvider } from "@danimai/tax/db";

export const UPDATE_TAX_PROVIDERS_PROCESS = Symbol("UpdateTaxProviders");

@Process(UPDATE_TAX_PROVIDERS_PROCESS)
export class UpdateTaxProvidersProcess
  implements ProcessContract<TaxProvider | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateTaxProviderSchema })
    context: ProcessContextType<typeof UpdateTaxProviderSchema>
  ) {
    const { input } = context;
    await this.validateTaxProvider(input);
    return this.updateTaxProvider(input);
  }

  async validateTaxProvider(input: UpdateTaxProviderProcessInput) {
    const row = await this.db
      .selectFrom("tax_providers")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Tax provider not found", [
        { type: "not_found", message: "Tax provider not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateTaxProvider(input: UpdateTaxProviderProcessInput) {
    this.logger.info("Updating tax provider", { input });
    const updateData: {
      name?: string;
      is_installed?: boolean;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.is_installed !== undefined) updateData.is_installed = input.is_installed;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("tax_providers")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
