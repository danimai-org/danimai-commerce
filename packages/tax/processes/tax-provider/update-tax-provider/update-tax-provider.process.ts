import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateTaxProviderProcessInput,
  type UpdateTaxProvidersProcessOutput,
  UpdateTaxProviderSchema,
} from "./update-tax-provider.schema";
import type { Database, TaxProvider } from "@danimai/tax/db";

export const UPDATE_TAX_PROVIDERS_PROCESS = Symbol("UpdateTaxProviders");

@Process(UPDATE_TAX_PROVIDERS_PROCESS)
export class UpdateTaxProvidersProcess
  implements ProcessContract<
    typeof UpdateTaxProviderSchema,
    UpdateTaxProvidersProcessOutput
  > {
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
    // Check if tax provider already exists
    if (input.name) {
      const existingTaxProvider = await this.db
        .selectFrom("tax_providers")
        .where("name", "ilike", input.name)
        .where("id", "!=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();
      if (existingTaxProvider) {
        throw new ValidationError("Tax provider name already exists", [
          { type: "already_exists", message: "Tax provider name already exists", path: "name" },
        ]);
      }
    }

    return this.db
      .updateTable("tax_providers")
      .set({ ...input, updated_at: sql`now()`, id: undefined })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
