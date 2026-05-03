import { createHash } from "node:crypto";
import {
  InjectDB,
  InjectLogger,
  InjectPassword,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  type Password,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { CUSTOMER_TOKEN_TYPES, type Database } from "../../../db/type";
import {
  PASSWORD_PROVIDER_NAME,
  PASSWORD_PROVIDER_TYPE,
} from "../constants";
import {
  type CustomerResetPasswordResponse,
  CustomerResetPasswordSchema,
} from "./reset-password.schema";

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/**
 * Consumes RESET_PASSWORD token and updates local password hash.
 */
export const CUSTOMER_RESET_PASSWORD_PROCESS = Symbol("CustomerResetPassword");

@Process(CUSTOMER_RESET_PASSWORD_PROCESS)
export class CustomerResetPasswordProcess
  implements
    ProcessContract<
      typeof CustomerResetPasswordSchema,
      CustomerResetPasswordResponse
    >
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectPassword()
    private readonly passwordService: Password
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CustomerResetPasswordSchema,
    })
    context: ProcessContextType<typeof CustomerResetPasswordSchema>
  ) {
    const { input } = context;
    const token_hash = hashToken(input.token.trim());
    const now = new Date().toISOString();
    const password_hash = await this.passwordService.hash(input.password.trim());

    return await this.db.transaction().execute(async (trx) => {
      const row = await trx
        .selectFrom("customer_tokens")
        .selectAll()
        .where("token_hash", "=", token_hash)
        .where("type", "=", CUSTOMER_TOKEN_TYPES.RESET_PASSWORD)
        .where("expires_at", ">", now)
        .where("used_at", "is", null)
        .forUpdate()
        .executeTakeFirst();

      if (!row) {
        throw new ValidationError("Invalid or expired reset token", [
          {
            type: "invalid",
            message: "Invalid or expired reset token",
            path: "token",
          },
        ]);
      }

      const updated = await trx
        .updateTable("auth_providers")
        .set({ password_hash, updated_at: new Date() })
        .where("customer_id", "=", row.customer_id)
        .where("provider_type", "=", PASSWORD_PROVIDER_TYPE)
        .where("provider_name", "=", PASSWORD_PROVIDER_NAME)
        .returning("id")
        .executeTakeFirst();

      if (!updated) {
        throw new ValidationError("Password provider not found", [
          {
            type: "not_found",
            message: "Password provider not found",
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

      return { customer_id: row.customer_id };
    });
  }
}
