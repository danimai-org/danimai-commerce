import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql, type Transaction } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateRegionProcessOutput,
  CreateRegionSchema,
} from "./create-region.schema";
import type { Database } from "../../db";

async function resolveRegionCode(
  trx: Transaction<Database>,
  regionId: string,
  currencyCode: string,
  requestedCode?: string,
): Promise<string> {
  const normalizedRequested = requestedCode?.trim().toUpperCase();
  const baseCode = normalizedRequested ?? currencyCode.trim().toUpperCase();

  const existing = await trx
    .selectFrom("regions")
    .select("id")
    .where("code", "=", baseCode)
    .where("deleted_at", "is", null)
    .executeTakeFirst();

  if (!existing) {
    return baseCode;
  }

  if (normalizedRequested) {
    throw new ValidationError("Region code is already in use", [
      {
        type: "not_unique",
        message: "Region code is already in use",
        path: "code",
      },
    ]);
  }

  const suffix = regionId.replace(/-/g, "").slice(0, 4).toUpperCase();
  return `${baseCode}${suffix}`;
}

/**
 * Handles the create regions process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_REGIONS_PROCESS = Symbol("CreateRegions");

@Process(CREATE_REGIONS_PROCESS)
export class CreateRegionsProcess
  implements ProcessContract<typeof CreateRegionSchema, CreateRegionProcessOutput> {
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
      schema: CreateRegionSchema,
    })
    context: ProcessContextType<typeof CreateRegionSchema>
  ) {
    const { input } = context;

    return this.db.transaction().execute(async (trx) => {
      const regionId = crypto.randomUUID();
      const currencyCode = input.currency_code.trim().toUpperCase();
      const code = await resolveRegionCode(
        trx,
        regionId,
        currencyCode,
        input.code,
      );

      const currency = await sql<{ symbol: string }>`
        select symbol
        from currencies
        where upper(code) = upper(${currencyCode})
          and deleted_at is null
        limit 1
      `.execute(trx);

      const region = await trx
        .insertInto("regions")
        .values({
          id: regionId,
          name: input.name,
          code,
          currency_code: currencyCode,
          currency_symbol: currency.rows[0]?.symbol ?? null,
          is_active: true,
          metadata: input.metadata ?? null,
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      const countryIds = input.countries?.length
        ? [...new Set(input.countries)]
        : [];
      if (countryIds.length > 0) {
        await trx
          .updateTable("countries")
          .set({ region_id: region.id, updated_at: sql`now()` })
          .where("deleted_at", "is", null)
          .where("id", "in", countryIds)
          .execute();
      }

      return region;
    });
  }

}
