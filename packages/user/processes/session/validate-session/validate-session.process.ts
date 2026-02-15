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
  type ValidateSessionProcessInput,
  ValidateSessionSchema,
} from "./validate-session.schema";
import type { Database, Session } from "../../../db/type";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const VALIDATE_SESSION_PROCESS = Symbol("ValidateSession");

@Process(VALIDATE_SESSION_PROCESS)
export class ValidateSessionProcess implements ProcessContract<Session | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: ValidateSessionSchema,
  }) context: ProcessContextType<typeof ValidateSessionSchema>) {
    const { input } = context;

    const now = new Date().toISOString();
    const session = await this.db
      .selectFrom("sessions")
      .where("id", "=", input.id)
      .where("user_id", "=", input.user_id)
      .where("expires_at", ">", now)
      .where("logged_out_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Invalid or expired session", [{
        type: "invalid",
        message: "Invalid or expired session",
        path: "id",
      }]);
    }

    if (
      input.refresh_token !== undefined &&
      session.refresh_token_hash != null &&
      session.refresh_token_hash !== hashToken(input.refresh_token)
    ) {
      throw new ValidationError("Invalid session", [{
        type: "invalid",
        message: "Invalid session",
        path: "refresh_token",
      }]);
    }

    return session;
  }
}
