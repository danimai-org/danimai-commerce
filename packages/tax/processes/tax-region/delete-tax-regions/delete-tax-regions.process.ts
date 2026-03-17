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
  type DeleteTaxRegionsProcessInput,
  type DeleteTaxRegionsProcessOutput,
  DeleteTaxRegionsSchema,
} from "./delete-tax-regions.schema";
import type { Database } from "@danimai/tax/db";

export const DELETE_TAX_REGIONS_PROCESS = Symbol("DeleteTaxRegions");

@Process(DELETE_TAX_REGIONS_PROCESS)
export class DeleteTaxRegionsProcess
  implements ProcessContract<
    typeof DeleteTaxRegionsSchema,
    DeleteTaxRegionsProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteTaxRegionsSchema })
    context: ProcessContextType<typeof DeleteTaxRegionsSchema>
  ) {
    const { input } = context;
    const existinTaxRegions = await this.db.selectFrom("tax_regions")
      .where("id", "in", input.tax_region_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (existinTaxRegions.length !== input.tax_region_ids.length) {
      throw new ValidationError(`Tax regions not found`, [
        { type: "not_found", message: `Tax regions not found`, path: "tax_region_ids" },
      ]);
    }

    await this.db
      .deleteFrom("tax_regions")
      .where("id", "in", input.tax_region_ids)
      .execute();
  }

}
