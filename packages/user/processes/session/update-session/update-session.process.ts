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
  type UpdateSessionProcessInput,
  UpdateSessionSchema,
} from "./update-session.schema";
import type { Database, Session } from "../../../db/type";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export const UPDATE_SESSION_PROCESS = Symbol("UpdateSession");

@Process(UPDATE_SESSION_PROCESS)
export class UpdateSessionProcess implements ProcessContract<Session | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateSessionSchema,
  }) context: ProcessContextType<typeof UpdateSessionSchema>) {
    const { input } = context;

    const updates: { refresh_token_hash?: string; expires_at?: string } = {};
    if (input.refresh_token !== undefined) {
      updates.refresh_token_hash = hashToken(input.refresh_token);
    }
    if (input.expires_at !== undefined) {
      updates.expires_at = input.expires_at;
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
