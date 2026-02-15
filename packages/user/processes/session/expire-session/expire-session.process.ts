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
  type ExpireSessionProcessInput,
  ExpireSessionSchema,
} from "./expire-session.schema";
import type { Database, Session } from "../../../db/type";

export const EXPIRE_SESSION_PROCESS = Symbol("ExpireSession");

@Process(EXPIRE_SESSION_PROCESS)
export class ExpireSessionProcess implements ProcessContract<Session | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(@ProcessContext({
    schema: ExpireSessionSchema,
  }) context: ProcessContextType<typeof ExpireSessionSchema>) {
    const { input } = context;
    const now = new Date().toISOString();

    const session = await this.db
      .updateTable("sessions")
      .set({
        logged_out_at: now,
        expires_at: now,
        updated_at: now,
      })
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
