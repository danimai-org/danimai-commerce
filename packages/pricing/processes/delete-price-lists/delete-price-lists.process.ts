import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import { Kysely } from "kysely";
import type { Database } from "../../db/type";
import {
  DeletePriceListsSchema,
  type DeletePriceListsProcessInput,
  type DeletePriceListsProcessOutput,
} from "./delete-price-lists.schema";

export const DELETE_PRICE_LISTS_PROCESS = Symbol("DeletePriceLists");

@Process(DELETE_PRICE_LISTS_PROCESS)
export class DeletePriceListsProcess
  implements
    ProcessContract<typeof DeletePriceListsSchema, DeletePriceListsProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeletePriceListsSchema })
    context: ProcessContextType<typeof DeletePriceListsSchema>,
  ): Promise<DeletePriceListsProcessOutput> {
    const { input } = context;
    await this.deletePriceLists(input);
  }

  private async deletePriceLists(input: DeletePriceListsProcessInput): Promise<void> {
    if (input.ids.length === 0) return;

    this.logger.info("Deleting price lists", { ids: input.ids });
    await this.db
      .updateTable("price_lists")
      .set({ deleted_at: new Date() })
      .where("id", "in", input.ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
