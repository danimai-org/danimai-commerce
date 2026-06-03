import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type DeletePaymentProvidersProcessOutput,
  DeletePaymentProvidersSchema,
} from "./delete-payment-providers.schema";
import type { Database } from "../../../db/type";

/**
 * Soft-deletes payment providers by id.
 * Input: payment_provider_ids array.
 * Output: void on success.
 */
export const DELETE_PAYMENT_PROVIDERS_PROCESS = Symbol("DeletePaymentProviders");

@Process(DELETE_PAYMENT_PROVIDERS_PROCESS)
export class DeletePaymentProvidersProcess
  implements
    ProcessContract<
      typeof DeletePaymentProvidersSchema,
      DeletePaymentProvidersProcessOutput
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: DeletePaymentProvidersSchema })
    context: ProcessContextType<typeof DeletePaymentProvidersSchema>
  ) {
    const { input } = context;

    const providers = await this.db
      .selectFrom("payment_providers")
      .where("id", "in", input.payment_provider_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (providers.length !== input.payment_provider_ids.length) {
      const foundIds = providers.map((p) => p.id);
      const missingIds = input.payment_provider_ids.filter(
        (id) => !foundIds.includes(id)
      );
      throw new ValidationError(
        `Payment providers not found: ${missingIds.join(", ")}`,
        [
          {
            type: "not_found",
            message: `Payment providers not found: ${missingIds.join(", ")}`,
            path: "payment_provider_ids",
          },
        ]
      );
    }

    this.logger.info("Deleting payment providers", {
      payment_provider_ids: input.payment_provider_ids,
    });

    await this.db
      .updateTable("payment_providers")
      .set({ deleted_at: new Date() })
      .where("id", "in", input.payment_provider_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
