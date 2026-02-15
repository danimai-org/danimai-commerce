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
  type CreateTaxRegionProcessInput,
  CreateTaxRegionsSchema,
} from "./create-tax-regions.schema";
import type { Database, TaxRegion } from "@danimai/tax/db";

export const CREATE_TAX_REGIONS_PROCESS = Symbol("CreateTaxRegions");

@Process(CREATE_TAX_REGIONS_PROCESS)
export class CreateTaxRegionsProcess
  implements ProcessContract<TaxRegion[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateTaxRegionsSchema })
    context: ProcessContextType<typeof CreateTaxRegionsSchema>
  ) {
    const { input } = context;
    const created: TaxRegion[] = [];
    for (const r of input.tax_regions) {
      const row = await this.createTaxRegion(r);
      if (row) created.push(row);
    }
    return created;
  }

  async createTaxRegion(input: CreateTaxRegionProcessInput) {
    this.logger.info("Creating tax region", { input });
    return this.db
      .insertInto("tax_regions")
      .values({
        name: input.name,
        tax_provider_id: input.tax_provider_id ?? null,
        parent_id: input.parent_id ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
