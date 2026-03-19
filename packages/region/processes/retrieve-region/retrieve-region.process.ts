import {
  InjectDB,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import {
  RetrieveRegionSchema,
  type RetrieveRegionProcessOutput,
} from "./retrieve-region.schema";
import type { Database } from "@danimai/region/db";

export const RETRIEVE_REGION_PROCESS = Symbol("RetrieveRegion");

@Process(RETRIEVE_REGION_PROCESS)
export class RetrieveRegionProcess
  implements ProcessContract<typeof RetrieveRegionSchema, RetrieveRegionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  async runOperations(
    @ProcessContext({
      schema: RetrieveRegionSchema,
    })
    context: ProcessContextType<typeof RetrieveRegionSchema>
  ) {
    const { input } = context;

    const region = await this.db
      .selectFrom("regions")
      .where("regions.id", "=", input.id)
      .where("regions.deleted_at", "is", null)
      .selectAll("regions")
      .executeTakeFirst();

    if (!region) {
      throw new NotFoundError("Region not found");
    }

    return region;
  }
}
