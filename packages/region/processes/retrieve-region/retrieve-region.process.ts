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

/**
 * Handles the retrieve region process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_REGION_PROCESS = Symbol("RetrieveRegion");

@Process(RETRIEVE_REGION_PROCESS)
export class RetrieveRegionProcess
  implements ProcessContract<typeof RetrieveRegionSchema, RetrieveRegionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
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

    const countries = await this.db
      .selectFrom("countries")
      .where("region_id", "=", region.id)
      .where("deleted_at", "is", null)
      .orderBy("display_name", "asc")
      .selectAll()
      .execute();

    return { ...region, countries };
  }
}
