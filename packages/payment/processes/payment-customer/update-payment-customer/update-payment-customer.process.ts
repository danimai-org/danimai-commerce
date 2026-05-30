import {
  InjectDB,
  InjectLogger,
  InjectStripe,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import type Stripe from "stripe";
import {
  type UpdatePaymentCustomerProcessOutput,
  UpdatePaymentCustomerSchema,
} from "./update-payment-customer.schema";
import type { Database } from "../../../db/type";

const STRIPE_CUSTOMER_FIELDS = [
  "email",
  "name",
  "phone",
  "description",
  "metadata",
  "address",
  "shipping",
  "tax_exempt",
  "preferred_locales",
] as const;

/** Maps validated input to Stripe CustomerUpdateParams (excludes local fields). */
function toStripeUpdateParams(
  input: Record<string, unknown>
): Stripe.CustomerUpdateParams {
  const params: Stripe.CustomerUpdateParams = {};
  for (const key of STRIPE_CUSTOMER_FIELDS) {
    if (input[key] !== undefined) {
      (params as Record<string, unknown>)[key] = input[key];
    }
  }
  return params;
}

/**
 * Updates a payment customer by syncing changes to Stripe and persisting locally.
 * Input: payment customer id, optional Stripe customer fields, optional status.
 * Output: updated payment_customers row.
 */
export const UPDATE_PAYMENT_CUSTOMER_PROCESS = Symbol("UpdatePaymentCustomer");

@Process(UPDATE_PAYMENT_CUSTOMER_PROCESS)
export class UpdatePaymentCustomerProcess
  implements ProcessContract<
    typeof UpdatePaymentCustomerSchema,
    UpdatePaymentCustomerProcessOutput
  >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectStripe()
    private readonly stripe: Stripe
  ) {}

  async runOperations(
    @ProcessContext({ schema: UpdatePaymentCustomerSchema })
    context: ProcessContextType<typeof UpdatePaymentCustomerSchema>
  ) {
    const { input } = context;
    this.logger.info("Updating payment customer", { id: input.id });

    const existingCustomer = await this.db
      .selectFrom("payment_customers")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!existingCustomer) {
      throw new NotFoundError("Payment customer not found");
    }

    const stripeParams = toStripeUpdateParams(input);
    const hasStripeUpdates = Object.keys(stripeParams).length > 0;

    let metadata = existingCustomer.metadata;
    if (hasStripeUpdates) {
      const stripeCustomer = await this.stripe.customers.update(
        existingCustomer.stripe_customer_id,
        stripeParams
      );
      metadata = stripeCustomer;
    }

    return this.db
      .updateTable("payment_customers")
      .set({
        metadata,
        status: input.status,
        updated_at: sql`now()`,
        id: undefined,
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
