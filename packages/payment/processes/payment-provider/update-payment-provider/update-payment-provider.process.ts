import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdatePaymentProviderProcessOutput,
  UpdatePaymentProviderSchema,
} from "./update-payment-provider.schema";
import type { Database } from "../../../db/type";

/**
 * Updates a payment provider including active/inactive toggling.
 * Input: provider id and optional name, metadata, or active flag.
 * Output: updated payment provider row.
 */
export const UPDATE_PAYMENT_PROVIDER_PROCESS = Symbol("UpdatePaymentProvider");

@Process(UPDATE_PAYMENT_PROVIDER_PROCESS)
export class UpdatePaymentProviderProcess
  implements ProcessContract<
    typeof UpdatePaymentProviderSchema,
    UpdatePaymentProviderProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdatePaymentProviderSchema })
    context: ProcessContextType<typeof UpdatePaymentProviderSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating payment provider", { id: input.id });

    if (input.name) {
      const existingProvider = await this.db
        .selectFrom("payment_providers")
        .where("name", "ilike", input.name)
        .where("id", "!=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();

      if (existingProvider) {
        throw new ValidationError("Payment provider name already exists", [
          {
            type: "already_exists",
            message: "Payment provider name already exists",
            path: "name",
          },
        ]);
      }
    }

    return this.db
      .updateTable("payment_providers")
      .set({ ...input, updated_at: sql`now()`, id: undefined })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
