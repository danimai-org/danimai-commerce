import {
  InjectDB,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  paginationResponse,
  SortOrder,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import {
  type PaginatedCountriesProcessOutput,
  PaginatedCountriesSchema,
} from "./paginated-countries.schema";
import type { Database } from "@danimai/region/db";

export const PAGINATED_COUNTRIES_PROCESS = Symbol("PaginatedCountries");

@Process(PAGINATED_COUNTRIES_PROCESS)
export class PaginatedCountriesProcess
  implements
    ProcessContract<
      typeof PaginatedCountriesSchema,
      PaginatedCountriesProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
  ) {}

  async runOperations(
    @ProcessContext({
      schema: PaginatedCountriesSchema,
    })
    context: ProcessContextType<typeof PaginatedCountriesSchema>,
  ) {
    const { input } = context;
    const {
      page = 1,
      limit = 10,
      sorting_field = "countries.display_name",
      sorting_direction = SortOrder.ASC,
    } = input;

    let query = this.db
      .selectFrom("countries")
      .where("deleted_at", "is", null);

    if (input.filters?.region_id) {
      query = query.where("region_id", "=", input.filters.region_id);
    }

    const search = (input.search ?? "").trim();
    if (search) {
      const term = `%${search}%`;
      query = query.where((eb) =>
        eb.or([
          eb("display_name", "ilike", term),
          eb("name", "ilike", term),
          eb("iso_2", "ilike", term),
        ]),
      );
    }

    const countResult = await query
      .select(({ fn }) => fn.count<number>("id").as("count"))
      .executeTakeFirst();

    const total = Number(countResult?.count ?? 0);

    query = query.orderBy(sql.ref(sorting_field), sorting_direction);

    const offset = (page - 1) * limit;
    const countries = await query
      .selectAll()
      .limit(limit)
      .offset(offset)
      .execute();

    return paginationResponse(countries, total, input);
  }
}
