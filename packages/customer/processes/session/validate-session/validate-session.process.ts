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
import {
  type ValidateCustomerSessionProcessOutput,
  ValidateCustomerSessionSchema,
} from "./validate-session.schema";
import type { Database } from "../../../db/type";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Validates an active customer_sessions row and optional refresh token.
 */
export const VALIDATE_CUSTOMER_SESSION_PROCESS = Symbol("ValidateCustomerSession");

@Process(VALIDATE_CUSTOMER_SESSION_PROCESS)
export class ValidateCustomerSessionProcess
  implements
    ProcessContract<
      typeof ValidateCustomerSessionSchema,
      ValidateCustomerSessionProcessOutput
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
      schema: ValidateCustomerSessionSchema,
    })
    context: ProcessContextType<typeof ValidateCustomerSessionSchema>
  ) {
    const { input } = context;

    const now = new Date().toISOString();
    const session = await this.db
      .selectFrom("customer_sessions")
      .where("id", "=", input.id)
      .where("customer_id", "=", input.customer_id)
      .where("expires_at", ">", now)
      .where("logged_out_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Invalid or expired session", [
        {
          type: "invalid",
          message: "Invalid or expired session",
          path: "id",
        },
      ]);
    }

    if (
      input.refresh_token !== undefined &&
      session.refresh_token_hash != null &&
      session.refresh_token_hash !== hashToken(input.refresh_token)
    ) {
      throw new ValidationError("Invalid session", [
        {
          type: "invalid",
          message: "Invalid session",
          path: "refresh_token",
        },
      ]);
    }

    return session;
  }
}
