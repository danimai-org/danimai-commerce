import { NotFoundError } from "@danimai/core";
import { Kysely, sql } from "kysely";
import type Stripe from "stripe";
import type { Database } from "../../db/type";

function toStripeCustomerParams(customer: {
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
}): Stripe.CustomerCreateParams & Stripe.CustomerUpdateParams {
  const name =
    [customer.first_name, customer.last_name].filter(Boolean).join(" ") ||
    undefined;

  return {
    email: customer.email,
    ...(name ? { name } : {}),
    ...(customer.phone ? { phone: customer.phone } : {}),
  };
}

/**
 * Returns payment_customers.stripe_customer_id, syncing the Stripe customer from local customers.
 */
export async function ensurePaymentCustomer(
  db: Kysely<Database>,
  stripe: Stripe,
  customerId: string,
  providerId: string
): Promise<{ stripe_customer_id: string }> {
  const customer = await db
    .selectFrom("customers")
    .where("id", "=", customerId)
    .where("deleted_at", "is", null)
    .select(["email", "first_name", "last_name", "phone"])
    .executeTakeFirst();

  if (!customer) {
    throw new NotFoundError("Customer not found");
  }

  const stripeParams = toStripeCustomerParams(customer);

  const existing = await db
    .selectFrom("payment_customers")
    .where("customer_id", "=", customerId)
    .where("provider_id", "=", providerId)
    .where("deleted_at", "is", null)
    .select(["id", "stripe_customer_id"])
    .executeTakeFirst();

  if (existing) {
    try {
      const stripeCustomer = await stripe.customers.update(
        existing.stripe_customer_id,
        {
          ...stripeParams,
          metadata: { customer_id: customerId },
        },
      );

      await db
        .updateTable("payment_customers")
        .set({
          metadata: stripeCustomer,
          updated_at: sql`now()`,
        })
        .where("id", "=", existing.id)
        .execute();

      return { stripe_customer_id: existing.stripe_customer_id };
    } catch (error) {
      const code =
        error &&
        typeof error === "object" &&
        "code" in error &&
        typeof (error as { code: unknown }).code === "string"
          ? (error as { code: string }).code
          : "";
      if (code !== "resource_missing") {
        throw error;
      }
    }
  }

  const stripeCustomer = await stripe.customers.create({
    ...stripeParams,
    metadata: { customer_id: customerId },
  });

  const paymentCustomer = await db
    .insertInto("payment_customers")
    .values({
      customer_id: customerId,
      provider_id: providerId,
      stripe_customer_id: stripeCustomer.id,
      metadata: stripeCustomer,
    })
    .returning(["stripe_customer_id"])
    .executeTakeFirstOrThrow();

  return paymentCustomer;
}
