import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../db/type";
import {
  RetrievePriceListSchema,
  type RetrievePriceListProcessOutput,
} from "./retrieve-price-list.schema";

export const RETRIEVE_PRICE_LIST_PROCESS = Symbol("RetrievePriceList");

@Process(RETRIEVE_PRICE_LIST_PROCESS)
export class RetrievePriceListProcess
  implements
    ProcessContract<typeof RetrievePriceListSchema, RetrievePriceListProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: RetrievePriceListSchema })
    context: ProcessContextType<typeof RetrievePriceListSchema>,
  ): Promise<RetrievePriceListProcessOutput> {
    const { input } = context;
    this.logger.debug("Retrieving price list", { id: input.id });

    const row = await this.db
      .selectFrom("price_lists")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!row) {
      throw new ValidationError("Price list not found", [
        {
          type: "not_found",
          message: "Price list not found",
          path: "id",
        },
      ]);
    }

    return row;
  }
}
