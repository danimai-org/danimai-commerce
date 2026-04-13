import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateRegionProcessInput,
  type CreateRegionProcessOutput,
  CreateRegionResponseSchema,
  CreateRegionSchema,
} from "./create-region.schema";
import type { Database, Region } from "../../db";

/**
 * Handles the create regions process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_REGIONS_PROCESS = Symbol("CreateRegions");

@Process(CREATE_REGIONS_PROCESS)
export class CreateRegionsProcess
  implements ProcessContract<typeof CreateRegionSchema, CreateRegionProcessOutput> {
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
    @ProcessContext({
      schema: CreateRegionSchema,
    })
    context: ProcessContextType<typeof CreateRegionSchema>
  ) {
    const { input } = context;

    return this.db.transaction().execute(async (trx) => {
      const region = await trx
        .insertInto("regions")
        .values({
          name: input.name,
          currency_code: input.currency_code,
          metadata: input.metadata ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const countryIds = input.countries?.length
        ? [...new Set(input.countries)]
        : [];
      if (countryIds.length > 0) {
        await trx
          .updateTable("countries")
          .set({ region_id: region.id, updated_at: sql`now()` })
          .where("deleted_at", "is", null)
          .where("id", "in", countryIds)
          .execute();
      }

      return region;
    });
  }

}
