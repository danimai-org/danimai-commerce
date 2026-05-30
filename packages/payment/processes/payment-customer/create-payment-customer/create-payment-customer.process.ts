import {
  InjectDB,
  InjectLogger,
  InjectStripe,
  NotFoundError,
  Process,
  ProcessContext,
  ValidationError,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import type Stripe from "stripe";
import {
  type CreatePaymentCustomerProcessOutput,
  CreatePaymentCustomerSchema,
} from "./create-payment-customer.schema";
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

/** Maps validated input to Stripe CustomerCreateParams (excludes local fields). */
function toStripeCreateParams(
  input: Record<string, unknown>
): Stripe.CustomerCreateParams {
  const params: Stripe.CustomerCreateParams = {};
  for (const key of STRIPE_CUSTOMER_FIELDS) {
    if (input[key] !== undefined) {
      (params as Record<string, unknown>)[key] = input[key];
    }
  }
  return params;
}

/**
 * Creates a payment customer by syncing to Stripe and persisting the mapping.
 * Input: customer_id, provider_id, and optional Stripe customer fields.
 * Output: created payment_customers row with Stripe customer id.
 */
export const CREATE_PAYMENT_CUSTOMER_PROCESS = Symbol("CreatePaymentCustomer");

@Process(CREATE_PAYMENT_CUSTOMER_PROCESS)
export class CreatePaymentCustomerProcess
  implements ProcessContract<
    typeof CreatePaymentCustomerSchema,
    CreatePaymentCustomerProcessOutput
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
    @ProcessContext({ schema: CreatePaymentCustomerSchema })
    context: ProcessContextType<typeof CreatePaymentCustomerSchema>
  ) {
    const { input } = context;
    this.logger.info("Creating payment customer", {
      customer_id: input.customer_id,
      provider_id: input.provider_id,
    });

    const provider = await this.db
      .selectFrom("payment_providers")
      .where("id", "=", input.provider_id)
      .where("deleted_at", "is", null)
      .select(["id", "active"])
      .executeTakeFirst();

    if (!provider) {
      throw new NotFoundError("Payment provider not found");
    }

    if (!provider.active) {
      throw new ValidationError("Payment provider is inactive", [
        {
          type: "invalid",
          message: "Payment provider is inactive",
          path: "provider_id",
        },
      ]);
    }

    const existingCustomer = await this.db
      .selectFrom("payment_customers")
      .where("customer_id", "=", input.customer_id)
      .where("provider_id", "=", input.provider_id)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existingCustomer) {
      throw new ValidationError("Payment customer already exists", [
        {
          type: "already_exists",
          message: "Payment customer already exists",
          path: "customer_id",
        },
      ]);
    }

    const stripeCustomer = await this.stripe.customers.create(
      toStripeCreateParams(input)
    );

    return this.db
      .insertInto("payment_customers")
      .values({
        customer_id: input.customer_id,
        provider_id: input.provider_id,
        stripe_customer_id: stripeCustomer.id,
        metadata: stripeCustomer,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
