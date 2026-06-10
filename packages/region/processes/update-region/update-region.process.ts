import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateRegionProcessInput,
  type UpdateRegionProcessOutput,
  UpdateRegionSchema,
} from "./update-region.schema";
import type { Database } from "@danimai/region/db";

/**
 * Handles the update region process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_REGION_PROCESS = Symbol("UpdateRegion");

@Process(UPDATE_REGION_PROCESS)
export class UpdateRegionProcess
  implements ProcessContract<typeof UpdateRegionSchema, UpdateRegionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(
    @ProcessContext({
      schema: UpdateRegionSchema,
    })
    context: ProcessContextType<typeof UpdateRegionSchema>
  ) {
    const { input } = context;

    const region = await this.db
      .selectFrom("regions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirstOrThrow();

    if (!region) {
      throw new NotFoundError("Region not found");
    }

    const currencyCode = input.currency_code?.trim().toUpperCase();
    let currencySymbol: string | null | undefined;
    if (currencyCode && currencyCode !== region.currency_code) {
      const currency = await sql<{ symbol: string }>`
        select symbol
        from currencies
        where upper(code) = upper(${currencyCode})
          and deleted_at is null
        limit 1
      `.execute(this.db);
      currencySymbol = currency.rows[0]?.symbol ?? null;
    }

    return this.db
      .updateTable("regions")
      .set({
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.code !== undefined
          ? { code: input.code.trim().toUpperCase() }
          : {}),
        ...(currencyCode !== undefined ? { currency_code: currencyCode } : {}),
        ...(currencySymbol !== undefined
          ? { currency_symbol: currencySymbol }
          : {}),
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        ...(input.is_active !== undefined ? { is_active: input.is_active } : {}),
        updated_at: sql`now()`,
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
