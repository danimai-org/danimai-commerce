import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateRegionProcessInput,
  UpdateRegionSchema,
} from "./update-regions.schema";
import type { Database, Region } from "@danimai/region/db";

export const UPDATE_REGIONS_PROCESS = Symbol("UpdateRegions");

@Process(UPDATE_REGIONS_PROCESS)
export class UpdateRegionsProcess
  implements ProcessContract<Region | undefined> {
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

    await this.validateRegion(input);
    return this.updateRegion(input);
  }

  async validateRegion(input: UpdateRegionProcessInput) {
    const region = await this.db
      .selectFrom("regions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!region) {
      throw new ValidationError("Region not found", [
        {
          type: "not_found",
          message: "Region not found",
          path: "id",
        },
      ]);
    }

    return region;
  }

  async updateRegion(input: UpdateRegionProcessInput) {
    this.logger.info("Updating region", { input });

    const updateData: {
      name?: string;
      currency_code?: string;
      metadata?: unknown;
    } = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.currency_code !== undefined)
      updateData.currency_code = input.currency_code;
    if (input.metadata !== undefined) updateData.metadata = input.metadata;

    return this.db
      .updateTable("regions")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
