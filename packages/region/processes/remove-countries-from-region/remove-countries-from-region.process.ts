import { InjectDB, Process, ProcessContext, type ProcessContextType, type ProcessContract } from "@danimai/core";
import { Kysely, sql } from "kysely";
import {
	type RemoveCountriesFromRegionProcessOutput,
	RemoveCountriesFromRegionSchema,
} from "./remove-countries-from-region.schema";
import type { Database } from "@danimai/region/db";

/**
 * Handles the remove countries from region process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const REMOVE_COUNTRIES_FROM_REGION_PROCESS = Symbol("RemoveCountriesFromRegion");

@Process(REMOVE_COUNTRIES_FROM_REGION_PROCESS)
export class RemoveCountriesFromRegionProcess
	implements ProcessContract<typeof RemoveCountriesFromRegionSchema, RemoveCountriesFromRegionProcessOutput>
{
	constructor(
		@InjectDB()
		private readonly db: Kysely<Database>
	) {}

	/**
	 * Executes the process business logic.
	 * Input: validated process context and request payload.
	 * Output: operation result object or entity payload.
	 */
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
