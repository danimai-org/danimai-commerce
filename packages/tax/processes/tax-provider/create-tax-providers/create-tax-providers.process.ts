import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateTaxProviderProcessInput,
  CreateTaxProvidersSchema,
} from "./create-tax-providers.schema";
import type { Database, TaxProvider } from "@danimai/tax/db";

export const CREATE_TAX_PROVIDERS_PROCESS = Symbol("CreateTaxProviders");

@Process(CREATE_TAX_PROVIDERS_PROCESS)
export class CreateTaxProvidersProcess
  implements ProcessContract<TaxProvider[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateTaxProvidersSchema })
    context: ProcessContextType<typeof CreateTaxProvidersSchema>
  ) {
    const { input } = context;
    const created: TaxProvider[] = [];
    for (const p of input.tax_providers) {
      const row = await this.createTaxProvider(p);
      if (row) created.push(row);
    }
    return created;
  }

  async createTaxProvider(input: CreateTaxProviderProcessInput) {
    this.logger.info("Creating tax provider", { input });
    return this.db
      .insertInto("tax_providers")
      .values({
        name: input.name,
        is_installed: input.is_installed ?? false,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
