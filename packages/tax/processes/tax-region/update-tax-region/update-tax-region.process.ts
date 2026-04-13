import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateTaxRegionProcessInput,
  type UpdateTaxRegionProcessOutput,
  UpdateTaxRegionSchema,
} from "./update-tax-region.schema";
import type { Database } from "@danimai/tax/db";

/**
 * Handles the update tax regions process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_TAX_REGIONS_PROCESS = Symbol("UpdateTaxRegions");

@Process(UPDATE_TAX_REGIONS_PROCESS)
export class UpdateTaxRegionsProcess
  implements ProcessContract<
    typeof UpdateTaxRegionSchema,
    UpdateTaxRegionProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: UpdateTaxRegionSchema })
    context: ProcessContextType<typeof UpdateTaxRegionSchema>
  ) {
    const { input } = context;
    const region = await this.db
      .selectFrom("tax_regions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!region) {
      throw new NotFoundError("Tax region not found");
    }

    return this.db
      .updateTable("tax_regions")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
