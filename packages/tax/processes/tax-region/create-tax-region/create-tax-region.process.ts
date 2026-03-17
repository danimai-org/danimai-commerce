import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  type CreateTaxRegionProcessOutput,
  CreateTaxRegionSchema,
} from "./create-tax-region.schema";
import type { Database } from "@danimai/tax/db";

export const CREATE_TAX_REGION_PROCESS = Symbol("CreateTaxRegion");

@Process(CREATE_TAX_REGION_PROCESS)
export class CreateTaxRegionProcess
  implements ProcessContract<
    typeof CreateTaxRegionSchema,
    CreateTaxRegionProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(
    @ProcessContext({ schema: CreateTaxRegionSchema })
    context: ProcessContextType<typeof CreateTaxRegionSchema>
  ) {
    const { input } = context;

    return this.db
      .insertInto("tax_regions")
      .values({
        name: input.name,
        tax_provider_id: input.tax_provider_id ?? null,
        parent_id: input.parent_id ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
