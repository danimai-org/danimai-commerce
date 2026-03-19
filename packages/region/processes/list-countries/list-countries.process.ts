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
  type ListCountriesProcessInput,
  ListCountriesSchema,
} from "./list-countries.schema";
import type { Database, Country } from "@danimai/region/db";

export const LIST_COUNTRIES_PROCESS = Symbol("ListCountries");

@Process(LIST_COUNTRIES_PROCESS)
export class ListCountriesProcess implements ProcessContract<Country[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: ListCountriesSchema })
    context: ProcessContextType<typeof ListCountriesSchema>
  ) {
    const input = context.input as ListCountriesProcessInput;

    const data = await this.db
      .selectFrom("countries")
      .where("deleted_at", "is", null)
      .where("region_id", "=", input.region_id)
      .orderBy("display_name", "asc")
      .selectAll()
      .execute();

    return data;
  }
}
