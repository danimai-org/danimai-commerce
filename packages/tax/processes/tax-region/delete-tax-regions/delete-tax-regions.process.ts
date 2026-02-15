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
  DeleteTaxRegionsSchema,
} from "./delete-tax-regions.schema";
import type { Database } from "@danimai/tax/db";

export const DELETE_TAX_REGIONS_PROCESS = Symbol("DeleteTaxRegions");

@Process(DELETE_TAX_REGIONS_PROCESS)
export class DeleteTaxRegionsProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: DeleteTaxRegionsSchema })
    context: ProcessContextType<typeof DeleteTaxRegionsSchema>
  ): Promise<void> {
    const { input } = context;
    await this.validateTaxRegions(input);
    await this.deleteTaxRegions(input);
  }

  async validateTaxRegions(input: DeleteTaxRegionsProcessInput) {
    const rows = await this.db
      .selectFrom("tax_regions")
      .where("id", "in", input.tax_region_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();
    if (rows.length !== input.tax_region_ids.length) {
      const found = rows.map((r) => r.id);
      const missing = input.tax_region_ids.filter((id) => !found.includes(id));
      throw new ValidationError(`Tax regions not found: ${missing.join(", ")}`, [
        { type: "not_found", message: `Tax regions not found: ${missing.join(", ")}`, path: "tax_region_ids" },
      ]);
    }
    return rows;
  }

  async deleteTaxRegions(input: DeleteTaxRegionsProcessInput) {
    this.logger.info("Deleting tax regions", { tax_region_ids: input.tax_region_ids });
    await this.db
      .updateTable("tax_regions")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.tax_region_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
