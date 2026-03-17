import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateTaxProviderProcessInput,
  type CreateTaxProviderProcessOutput,
  CreateTaxProviderSchema,
} from "./create-tax-provider.schema";
import type { Database, TaxProvider } from "@danimai/tax/db";

export const CREATE_TAX_PROVIDER_PROCESS = Symbol("CreateTaxProvider");

@Process(CREATE_TAX_PROVIDER_PROCESS)
export class CreateTaxProviderProcess
  implements ProcessContract<
    typeof CreateTaxProviderSchema,
    CreateTaxProviderProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateTaxProviderSchema })
    context: ProcessContextType<typeof CreateTaxProviderSchema>
  ) {
    const { input } = context;

    // Check if tax provider already exists
    const existingTaxProvider = await this.db
      .selectFrom("tax_providers")
      .where("name", "ilike", input.name)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();
    if (existingTaxProvider) {
      throw new ValidationError("Tax provider already exists", [
        { type: "already_exists", message: "Tax provider already exists", path: "name" },
      ]);
    }

    return this.db
      .insertInto("tax_providers")
      .values({
        name: input.name,
        is_installed: input.is_installed ?? false,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

}
