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

/**
 * Handles the list countries process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const LIST_COUNTRIES_PROCESS = Symbol("ListCountries");

@Process(LIST_COUNTRIES_PROCESS)
export class ListCountriesProcess implements ProcessContract<Country[]> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({ schema: ListCountriesSchema })
    context: ProcessContextType<typeof ListCountriesSchema>,
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
