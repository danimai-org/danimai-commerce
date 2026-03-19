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
  type CreateRegionProcessInput,
  type CreateRegionProcessOutput,
  CreateRegionResponseSchema,
  CreateRegionSchema,
} from "./create-region.schema";
import type { Database, Region } from "../../db";

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

  async runOperations(
    @ProcessContext({
      schema: CreateRegionSchema,
    })
    context: ProcessContextType<typeof CreateRegionSchema>
  ) {
    const { input } = context;

    return this.db
      .insertInto("regions")
      .values({
        name: input.name,
        currency_code: input.currency_code,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }

}
