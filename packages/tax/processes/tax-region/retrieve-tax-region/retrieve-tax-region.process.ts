import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type RetrieveTaxRegionProcessOutput,
  RetrieveTaxRegionSchema,
} from "./retrieve-tax-region.schema";
import type { Database } from "@danimai/tax/db";

/**
 * Handles the retrieve tax region process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_TAX_REGION_PROCESS = Symbol("RetrieveTaxRegion");

@Process(RETRIEVE_TAX_REGION_PROCESS)
export class RetrieveTaxRegionProcess
  implements ProcessContract<
    typeof RetrieveTaxRegionSchema,
    RetrieveTaxRegionProcessOutput
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
    @ProcessContext({ schema: RetrieveTaxRegionSchema })
    context: ProcessContextType<typeof RetrieveTaxRegionSchema>
  ) {
    const { input } = context;

    return this.db
      .selectFrom("tax_regions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
  }
}
