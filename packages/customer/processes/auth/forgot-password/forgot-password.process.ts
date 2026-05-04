import { createHash, randomBytes } from "node:crypto";
import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { CUSTOMER_TOKEN_TYPES, type Database } from "../../../db/type";
import { RESET_PASSWORD_TTL_MS } from "../constants";
import {
  type CustomerForgotPasswordResponse,
  CustomerForgotPasswordSchema,
} from "./forgot-password.schema";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Creates a RESET_PASSWORD token; returns raw token only when the email exists.
 */
export const CUSTOMER_FORGOT_PASSWORD_PROCESS = Symbol("CustomerForgotPassword");

@Process(CUSTOMER_FORGOT_PASSWORD_PROCESS)
export class CustomerForgotPasswordProcess
  implements
    ProcessContract<
      typeof CustomerForgotPasswordSchema,
      CustomerForgotPasswordResponse
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CustomerForgotPasswordSchema,
    })
    context: ProcessContextType<typeof CustomerForgotPasswordSchema>
  ) {
    const { input } = context;
    const email = input.email.trim().toLowerCase();

    const customer = await this.db
      .selectFrom("customers")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (!customer) {
      return { reset_token: null };
    }

    const reset_token = generateRawToken();
    const token_hash = hashToken(reset_token);
    const expires_at = new Date(Date.now() + RESET_PASSWORD_TTL_MS).toISOString();

    await this.db
      .insertInto("customer_tokens")
      .values({
        customer_id: customer.id,
        token_hash,
        type: CUSTOMER_TOKEN_TYPES.RESET_PASSWORD,
        expires_at,
        used_at: null,
      })
      .execute();

    return { reset_token };
  }
}
