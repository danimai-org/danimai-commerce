import { createHash } from "node:crypto";
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
import { CUSTOMER_TOKEN_TYPES, type Database } from "../../../db/type";
import {
  type VerifyCustomerResponse,
  VerifyCustomerSchema,
} from "./verify-customer.schema";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Consumes SIGNUP_VERIFY token and sets customer active.
 */
export const VERIFY_CUSTOMER_PROCESS = Symbol("VerifyCustomer");

@Process(VERIFY_CUSTOMER_PROCESS)
export class VerifyCustomerProcess
  implements ProcessContract<typeof VerifyCustomerSchema, VerifyCustomerResponse>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: VerifyCustomerSchema,
    })
    context: ProcessContextType<typeof VerifyCustomerSchema>
  ) {
    const { input } = context;
    const token_hash = hashToken(input.token.trim());
    const now = new Date().toISOString();

    return await this.db.transaction().execute(async (trx) => {
      const row = await trx
        .selectFrom("customer_tokens")
        .selectAll()
        .where("token_hash", "=", token_hash)
        .where("type", "=", CUSTOMER_TOKEN_TYPES.SIGNUP_VERIFY)
        .where("expires_at", ">", now)
        .where("used_at", "is", null)
        .forUpdate()
        .executeTakeFirst();

      if (!row) {
        throw new ValidationError("Invalid or expired verification token", [
          {
            type: "invalid",
            message: "Invalid or expired verification token",
            path: "token",
          },
        ]);
      }

      const customer = await trx
        .selectFrom("customers")
        .select("id")
        .where("id", "=", row.customer_id)
        .where("deleted_at", "is", null)
        .forUpdate()
        .executeTakeFirst();

      if (!customer) {
        throw new ValidationError("Customer not found", [
          {
            type: "not_found",
            message: "Customer not found",
            path: "token",
          },
        ]);
      }

      const used = new Date().toISOString();
      await trx
        .updateTable("customer_tokens")
        .set({ used_at: used, updated_at: new Date() })
        .where("id", "=", row.id)
        .execute();

      await trx
        .updateTable("customers")
        .set({ active: true, updated_at: new Date() })
        .where("id", "=", customer.id)
        .execute();

      return { customer_id: customer.id };
    });
  }
}
