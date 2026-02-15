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
  type UpdateTaxRegionProcessInput,
  UpdateTaxRegionSchema,
} from "./update-tax-regions.schema";
import type { Database, TaxRegion } from "@danimai/tax/db";

export const UPDATE_TAX_REGIONS_PROCESS = Symbol("UpdateTaxRegions");

@Process(UPDATE_TAX_REGIONS_PROCESS)
export class UpdateTaxRegionsProcess
  implements ProcessContract<TaxRegion | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: UpdateTaxRegionSchema })
    context: ProcessContextType<typeof UpdateTaxRegionSchema>
  ) {
    const { input } = context;
    await this.validateTaxRegion(input);
    return this.updateTaxRegion(input);
  }

  async validateTaxRegion(input: UpdateTaxRegionProcessInput) {
    const row = await this.db
      .selectFrom("tax_regions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();
    if (!row) {
      throw new ValidationError("Tax region not found", [
        { type: "not_found", message: "Tax region not found", path: "id" },
      ]);
    }
    return row;
  }

  async updateTaxRegion(input: UpdateTaxRegionProcessInput) {
    this.logger.info("Updating tax region", { input });
    const updateData: {
      name?: string;
      tax_provider_id?: string | null;
      parent_id?: string | null;
      metadata?: unknown;
    } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.tax_provider_id !== undefined) updateData.tax_provider_id = input.tax_provider_id;
    if (input.parent_id !== undefined) updateData.parent_id = input.parent_id;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;
    return this.db
      .updateTable("tax_regions")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
