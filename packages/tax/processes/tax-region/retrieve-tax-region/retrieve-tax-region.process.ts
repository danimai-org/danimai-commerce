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
