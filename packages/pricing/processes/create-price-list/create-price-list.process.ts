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
  CreatePriceListSchema,
  type CreatePriceListProcessOutput,
} from "./create-price-list.schema";

export const CREATE_PRICE_LIST_PROCESS = Symbol("CreatePriceList");

@Process(CREATE_PRICE_LIST_PROCESS)
export class CreatePriceListProcess
  implements ProcessContract<typeof CreatePriceListSchema, CreatePriceListProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreatePriceListSchema })
    context: ProcessContextType<typeof CreatePriceListSchema>,
  ): Promise<CreatePriceListProcessOutput> {
    const { input } = context;
    this.logger.info("Creating price list", { name: input.name });

    const row = await this.db
      .insertInto("price_lists")
      .values({
        name: input.name,
        description: input.description ?? null,
        type: input.type ?? "sale",
        status: input.status ?? "draft",
        starts_at: input.starts_at ?? null,
        ends_at: input.ends_at ?? null,
        metadata: input.metadata ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return row;
  }
}
