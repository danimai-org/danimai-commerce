import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreatePaymentProviderProcessOutput,
  CreatePaymentProviderSchema,
} from "./create-payment-provider.schema";
import type { Database } from "../../../db/type";

/**
 * Creates a payment provider after validating name uniqueness.
 * Input: name and optional metadata/active flag.
 * Output: created payment provider row.
 */
export const CREATE_PAYMENT_PROVIDER_PROCESS = Symbol("CreatePaymentProvider");

@Process(CREATE_PAYMENT_PROVIDER_PROCESS)
export class CreatePaymentProviderProcess
  implements ProcessContract<
    typeof CreatePaymentProviderSchema,
    CreatePaymentProviderProcessOutput
  > {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({ schema: CreatePaymentProviderSchema })
    context: ProcessContextType<typeof CreatePaymentProviderSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating payment provider", { name: input.name });

    const existingProvider = await this.db
      .selectFrom("payment_providers")
      .where("name", "ilike", input.name)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existingProvider) {
      throw new ValidationError("Payment provider already exists", [
        {
          type: "already_exists",
          message: "Payment provider already exists",
          path: "name",
        },
      ]);
    }

    return this.db
      .insertInto("payment_providers")
      .values({
        name: input.name,
        metadata: input.metadata ?? null,
        active: input.active ?? true,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
