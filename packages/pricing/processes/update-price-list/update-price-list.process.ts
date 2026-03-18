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
  UpdatePriceListSchema,
  type UpdatePriceListProcessInput,
  type UpdatePriceListProcessOutput,
} from "./update-price-list.schema";

export const UPDATE_PRICE_LIST_PROCESS = Symbol("UpdatePriceList");

@Process(UPDATE_PRICE_LIST_PROCESS)
export class UpdatePriceListProcess
  implements ProcessContract<typeof UpdatePriceListSchema, UpdatePriceListProcessOutput>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdatePriceListSchema })
    context: ProcessContextType<typeof UpdatePriceListSchema>,
  ): Promise<UpdatePriceListProcessOutput> {
    const { input } = context;
    this.logger.info("Updating price list", { id: input.id });

    const existing = await this.db
      .selectFrom("price_lists")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!existing) {
      throw new ValidationError("Price list not found", [
        {
          type: "not_found",
          message: "Price list not found",
          path: "id",
        },
      ]);
    }

    const update: {
      name?: string;
      description?: string | null;
      type?: "sale" | "override";
      status?: "active" | "draft";
      starts_at?: string | null;
      ends_at?: string | null;
      metadata?: unknown | null;
      updated_at: Date;
    } = {
      updated_at: new Date(),
    };

    this.applyUpdateFields(input, update);

    return this.db
      .updateTable("price_lists")
      .set(update)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst()
      .then((row) => row ?? null);
  }

  private applyUpdateFields(
    input: UpdatePriceListProcessInput,
    update: {
      name?: string;
      description?: string | null;
      type?: "sale" | "override";
      status?: "active" | "draft";
      starts_at?: string | null;
      ends_at?: string | null;
      metadata?: unknown | null;
      updated_at: Date;
    },
  ) {
    if (input.name !== undefined) update.name = input.name;
    if (input.description !== undefined) update.description = input.description;
    if (input.type !== undefined) update.type = input.type;
    if (input.status !== undefined) update.status = input.status;
    if (input.starts_at !== undefined) update.starts_at = input.starts_at;
    if (input.ends_at !== undefined) update.ends_at = input.ends_at;
    if (input.metadata !== undefined) update.metadata = input.metadata;
  }
}
