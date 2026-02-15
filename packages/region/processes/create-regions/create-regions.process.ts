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
  CreateRegionsSchema,
} from "./create-regions.schema";
import type { Database, Region } from "../../db";

export const CREATE_REGIONS_PROCESS = Symbol("CreateRegions");

@Process(CREATE_REGIONS_PROCESS)
export class CreateRegionsProcess
  implements ProcessContract<Region[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(
    @ProcessContext({
      schema: CreateRegionsSchema,
    })
    context: ProcessContextType<typeof CreateRegionsSchema>
  ) {
    const { input } = context;

    const created: Region[] = [];
    for (const r of input.regions) {
      const region = await this.createRegion(r);
      if (region) created.push(region);
    }
    return created;
  }

  async createRegion(input: CreateRegionProcessInput) {
    this.logger.info("Creating region", { input });

    return this.db
      .insertInto("regions")
      .values({
        name: input.name,
        currency_code: input.currency_code,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirst();
  }
}
