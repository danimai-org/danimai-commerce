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
  type DeleteRegionsProcessInput,
  DeleteRegionsSchema,
} from "./delete-regions.schema";
import type { Database } from "@danimai/region/db";

export const DELETE_REGIONS_PROCESS = Symbol("DeleteRegions");

@Process(DELETE_REGIONS_PROCESS)
export class DeleteRegionsProcess implements ProcessContract<void> {
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
  ): Promise<void> {
    const { input } = context;

    await this.validateRegions(input);
    await this.deleteRegions(input);
  }

  async validateRegions(input: DeleteRegionsProcessInput) {
    const regions = await this.db
      .selectFrom("regions")
      .where("id", "in", input.region_ids)
      .where("deleted_at", "is", null)
      .selectAll()
      .execute();

    if (regions.length !== input.region_ids.length) {
      const foundIds = regions.map((r) => r.id);
      const missingIds = input.region_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Regions not found: ${missingIds.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Regions not found: ${missingIds.join(", ")}`,
            path: "region_ids",
          },
        ]
      );
    }

    return regions;
  }

  async deleteRegions(input: DeleteRegionsProcessInput) {
    this.logger.info("Deleting regions", { region_ids: input.region_ids });

    await this.db
      .updateTable("regions")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.region_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
