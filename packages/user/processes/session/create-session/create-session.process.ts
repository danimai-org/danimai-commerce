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
  type CreateSessionProcessInput,
  CreateSessionSchema,
} from "./create-session.schema";
import type { Database, Session } from "../../../db/type";

export const CREATE_SESSION_PROCESS = Symbol("CreateSession");

@Process(CREATE_SESSION_PROCESS)
export class CreateSessionProcess implements ProcessContract<Session | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: CreateSessionSchema,
  }) context: ProcessContextType<typeof CreateSessionSchema>) {
    const { input } = context;

    const session = await this.db
      .insertInto("sessions")
      .values({
        user_id: input.user_id,
        expires_at: input.expires_at,
        ip_address: input.ip_address ?? null,
        user_agent: input.user_agent ?? null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Failed to create session", [{
        type: "invalid",
        message: "Failed to create session",
        path: "user_id",
      }]);
    }

    return session;
  }
}
