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
  type UpdateCustomerSessionProcessOutput,
  UpdateCustomerSessionSchema,
} from "./update-session.schema";
import type { Database } from "../../../db/type";

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Updates customer_sessions (refresh hash, expiry, customer_id).
 */
export const UPDATE_CUSTOMER_SESSION_PROCESS = Symbol("UpdateCustomerSession");

@Process(UPDATE_CUSTOMER_SESSION_PROCESS)
export class UpdateCustomerSessionProcess
  implements
    ProcessContract<
      typeof UpdateCustomerSessionSchema,
      UpdateCustomerSessionProcessOutput
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
      schema: UpdateCustomerSessionSchema,
    })
    context: ProcessContextType<typeof UpdateCustomerSessionSchema>
  ) {
    const { input } = context;

    const updates: {
      refresh_token_hash?: string;
      expires_at?: string;
      customer_id?: string | null;
    } = {};
    if (input.refresh_token !== undefined) {
      updates.refresh_token_hash = hashToken(input.refresh_token);
    }
    if (input.expires_at !== undefined) {
      updates.expires_at = input.expires_at;
    }
    if (input.customer_id !== undefined) {
      updates.customer_id = input.customer_id;
    }

    if (Object.keys(updates).length === 0) {
      const existing = await this.db
        .selectFrom("customer_sessions")
        .where("id", "=", input.id)
        .selectAll()
        .executeTakeFirst();
      return existing ?? undefined;
    }

    const session = await this.db
      .updateTable("customer_sessions")
      .set(updates)
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Session not found", [
        {
          type: "not_found",
          message: "Session not found",
          path: "id",
        },
      ]);
    }

    return session;
  }
}
