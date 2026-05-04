import { createHash, randomBytes } from "node:crypto";
import {
  InjectDB,
  InjectEmail,
  InjectLogger,
  InjectPassword,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  type EmailInterface,
  type Password,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { CUSTOMER_TOKEN_TYPES, type Database } from "../../../db/type";
import {
  PASSWORD_PROVIDER_NAME,
  PASSWORD_PROVIDER_TYPE,
  SIGNUP_VERIFY_TTL_MS,
} from "../constants";

const VERIFY_EMAIL_TEMPLATE = "verify-email";
const VERIFY_EMAIL_SUBJECT = "Verify your email";
import {
  type CustomerSignupResponse,
  CustomerSignupSchema,
} from "./signup.schema";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function generateRawToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Registers email/password: customer (inactive), auth_providers row, SIGNUP_VERIFY token (hashed), and sends the raw token by email.
 */
export const CUSTOMER_SIGNUP_PROCESS = Symbol("CustomerSignup");

@Process(CUSTOMER_SIGNUP_PROCESS)
export class CustomerSignupProcess
  implements ProcessContract<typeof CustomerSignupSchema, CustomerSignupResponse>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectPassword()
    private readonly passwordService: Password,
    @InjectEmail()
    private readonly emailService: EmailInterface
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CustomerSignupSchema,
    })
    context: ProcessContextType<typeof CustomerSignupSchema>
  ) {
    const { input } = context;
    this.logger.info("Customer signup", { email: input.email });
    const email = input.email.trim().toLowerCase();

    const existing = await this.db
      .selectFrom("customers")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existing) {
      throw new ValidationError("Email already registered", [
        {
          type: "invalid",
          message: "Email already registered",
          path: "email",
        },
      ]);
    }

    const password_hash = await this.passwordService.hash(input.password.trim());
    const verification_token = generateRawToken();
    const token_hash = hashToken(verification_token);
    const expires_at = new Date(Date.now() + SIGNUP_VERIFY_TTL_MS).toISOString();

    let customer_id: string;
    try {
      customer_id = await this.db.transaction().execute(async (trx) => {
        const inserted = await trx
          .insertInto("customers")
          .values({
            email,
            first_name: input.first_name ?? null,
            last_name: input.last_name ?? null,
            phone: input.phone ?? null,
            has_account: true,
            active: false,
            metadata: null,
          })
          .returning("id")
          .executeTakeFirstOrThrow();

        await trx
          .insertInto("auth_providers")
          .values({
            customer_id: inserted.id,
            provider_type: PASSWORD_PROVIDER_TYPE,
            provider_name: PASSWORD_PROVIDER_NAME,
            provider_account_id: email,
            password_hash,
            access_token: null,
            refresh_token: null,
          })
          .execute();

        await trx
          .insertInto("customer_tokens")
          .values({
            customer_id: inserted.id,
            token_hash,
            type: CUSTOMER_TOKEN_TYPES.SIGNUP_VERIFY,
            expires_at,
            used_at: null,
          })
          .execute();

        return inserted.id;
      });
    } catch (err: unknown) {
      const code =
        err && typeof err === "object" && "code" in err
          ? String((err as { code: unknown }).code)
          : "";
      if (code === "23505") {
        throw new ValidationError("Email already registered", [
          {
            type: "invalid",
            message: "Email already registered",
            path: "email",
          },
        ]);
      }
      throw err;
    }

    const frontendUrl =
      typeof process !== "undefined" ? process.env?.FRONTEND_URL ?? "" : "";
    const base = frontendUrl.replace(/\/+$/, "");
    const verifyLink = base
      ? `${base}/verify-email?token=${encodeURIComponent(verification_token)}`
      : "";

    try {
      await this.emailService.sendEmail(email, {
        subject: VERIFY_EMAIL_SUBJECT,
        template: VERIFY_EMAIL_TEMPLATE,
        context: {
          email,
          token: verification_token,
          verifyLink,
          expiresAt: expires_at,
          firstName: input.first_name ?? undefined,
        },
      });
    } catch (err: unknown) {
      this.logger.error("Signup verification email failed", {
        email,
        customer_id,
        error: err,
      });
      await this.db
        .deleteFrom("customers")
        .where("id", "=", customer_id)
        .execute();
      throw new Error("Failed to send verification email");
    }

    return {
      message: "Check your email for a link to verify your account.",
    };
  }
}
