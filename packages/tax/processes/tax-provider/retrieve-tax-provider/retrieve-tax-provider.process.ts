import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type RetrieveTaxProviderProcessOutput,
  RetrieveTaxProviderSchema,
} from "./retrieve-tax-provider.schema";
import type { Database } from "@danimai/tax/db";

/**
 * Handles the retrieve tax provider process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_TAX_PROVIDER_PROCESS = Symbol("RetrieveTaxProvider");

@Process(RETRIEVE_TAX_PROVIDER_PROCESS)
export class RetrieveTaxProviderProcess
  implements ProcessContract<
    typeof RetrieveTaxProviderSchema,
    RetrieveTaxProviderProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: RetrieveTaxProviderSchema })
    context: ProcessContextType<typeof RetrieveTaxProviderSchema>
  ) {
    const { input } = context;

    return this.db
      .selectFrom("tax_providers")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
  }
}
