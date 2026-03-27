import { InjectDB, Process, ProcessContext, type ProcessContextType, type ProcessContract } from "@danimai/core";
import { Kysely, sql } from "kysely";
import {
	type RemoveCountriesFromRegionProcessOutput,
	RemoveCountriesFromRegionSchema,
} from "./remove-countries-from-region.schema";
import type { Database } from "@danimai/region/db";

export const REMOVE_COUNTRIES_FROM_REGION_PROCESS = Symbol("RemoveCountriesFromRegion");

@Process(REMOVE_COUNTRIES_FROM_REGION_PROCESS)
export class RemoveCountriesFromRegionProcess
	implements ProcessContract<typeof RemoveCountriesFromRegionSchema, RemoveCountriesFromRegionProcessOutput>
{
	constructor(
		@InjectDB()
		private readonly db: Kysely<Database>
	) {}

	async runOperations(
		@ProcessContext({
			schema: RemoveCountriesFromRegionSchema,
		})
		context: ProcessContextType<typeof RemoveCountriesFromRegionSchema>
	) {
		const { input } = context;

		if (input.ids.length === 0) {
			return;
		}

		await this.db
			.updateTable("countries")
			.set({ region_id: null, updated_at: sql`now()` })
			.where("region_id", "=", input.region_id)
			.where("id", "in", input.ids)
			.where("deleted_at", "is", null)
			.execute();
	}
}
