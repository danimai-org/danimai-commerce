import {
	InjectDB,
	Process,
	ProcessContext,
	type ProcessContextType,
	type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import {
	type AddCountriesToRegionProcessOutput,
	AddCountriesToRegionSchema,
} from "./add-countries-to-region.schema";
import type { Database } from "@danimai/region/db";

export const ADD_COUNTRIES_TO_REGION_PROCESS = Symbol("AddCountriesToRegion");

@Process(ADD_COUNTRIES_TO_REGION_PROCESS)
export class AddCountriesToRegionProcess
	implements ProcessContract<typeof AddCountriesToRegionSchema, AddCountriesToRegionProcessOutput>
{
	constructor(
		@InjectDB()
		private readonly db: Kysely<Database>
	) {}

	async runOperations(
		@ProcessContext({
			schema: AddCountriesToRegionSchema,
		})
		context: ProcessContextType<typeof AddCountriesToRegionSchema>
	) {
		const { input } = context;

		if (input.ids.length === 0) {
			return;
		}

		const codes = [
			...new Set(input.ids.map((c) => String(c).trim().toUpperCase())),
		].filter((c) => c.length >= 2);

		if (codes.length === 0) {
			return;
		}

		await this.db
			.updateTable("countries")
			.set({ region_id: input.region_id, updated_at: sql`now()` })
			.where("deleted_at", "is", null)
			.where((eb) =>
				eb.or(codes.map((code) => eb(sql`upper(trim(iso_2))`, "=", code)))
			)
			.execute();
	}
}
