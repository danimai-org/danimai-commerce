import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateRegionProcessInput,
  type UpdateRegionProcessOutput,
  UpdateRegionSchema,
} from "./update-region.schema";
import type { Database } from "@danimai/region/db";

export const UPDATE_REGION_PROCESS = Symbol("UpdateRegion");

@Process(UPDATE_REGION_PROCESS)
export class UpdateRegionProcess
  implements ProcessContract<typeof UpdateRegionSchema, UpdateRegionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: UpdateRegionSchema,
    })
    context: ProcessContextType<typeof UpdateRegionSchema>
  ) {
    const { input } = context;

    const region = await this.db
      .selectFrom("regions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (!region) {
      throw new NotFoundError("Region not found");
    }

    return this.db
      .updateTable("regions")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
