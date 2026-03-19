import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  DeleteRegionsSchema,
} from "./delete-regions.schema";
import type { Database } from "@danimai/region/db";

export const DELETE_REGIONS_PROCESS = Symbol("DeleteRegions");

@Process(DELETE_REGIONS_PROCESS)
export class DeleteRegionsProcess implements ProcessContract<typeof DeleteRegionsSchema, void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: DeleteRegionsSchema,
    })
    context: ProcessContextType<typeof DeleteRegionsSchema>
  ) {
    const { input } = context;


    const regions = await this.db
      .selectFrom("regions")
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (regions.length !== input.ids.length) {
      throw new NotFoundError(`Regions not found`);
    }

    await this.db
      .deleteFrom("regions")
      .where("id", "in", input.ids)
      .execute();
  }
}
