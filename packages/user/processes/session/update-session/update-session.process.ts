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
  type UpdateSessionProcessOutput,
  UpdateSessionSchema,
} from "./update-session.schema";
import type { Database } from "../../../db/type";

/**
 * Helper: hashToken.
 * Input: function parameters for query/shape logic.
 * Output: derived data used by the process flow.
 */
function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Handles the update session process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const UPDATE_SESSION_PROCESS = Symbol("UpdateSession");

@Process(UPDATE_SESSION_PROCESS)
export class UpdateSessionProcess
  implements ProcessContract<typeof UpdateSessionSchema, UpdateSessionProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  /**
   * Executes the process business logic.
   * Input: validated process context and request payload.
   * Output: operation result object or entity payload.
   */
  async runOperations(@ProcessContext({
    schema: UpdateSessionSchema,
  }) context: ProcessContextType<typeof UpdateSessionSchema>) {
    const { input } = context;

    const updates: {
      refresh_token_hash?: string;
      expires_at?: string;
      user_id?: string | null;
    } = {};
    if (input.refresh_token !== undefined) {
      updates.refresh_token_hash = hashToken(input.refresh_token);
    }
    if (input.expires_at !== undefined) {
      updates.expires_at = input.expires_at;
    }
    if (input.user_id !== undefined) {
      updates.user_id = input.user_id;
    }

    if (Object.keys(updates).length === 0) {
      const existing = await this.db
        .withSchema("public")
        .selectFrom("sessions")
        .where("id", "=", input.id)
        .selectAll()
        .executeTakeFirst();
      return existing ?? undefined;
    }

    const session = await this.db
      .updateTable("sessions")
      .set(updates)
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Session not found", [{
        type: "not_found",
        message: "Session not found",
        path: "id",
      }]);
    }

    return session;
  }
}
