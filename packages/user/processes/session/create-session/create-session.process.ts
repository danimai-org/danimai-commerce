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
  type CreateSessionProcessOutput,
  CreateSessionSchema,
  DEFAULT_SESSION_TTL_DAYS,
} from "./create-session.schema";
import type { Database } from "../../../db/type";

export const CREATE_SESSION_PROCESS = Symbol("CreateSession");

@Process(CREATE_SESSION_PROCESS)
export class CreateSessionProcess
  implements ProcessContract<typeof CreateSessionSchema, CreateSessionProcessOutput> {
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

    let parent_id: string | null = null;
    if (input.expired_session_id !== undefined) {
      const expired = await this.db
        .selectFrom("sessions")
        .select("id")
        .where("id", "=", input.expired_session_id)
        .where("expires_at", "<", new Date().toISOString())
        .executeTakeFirst();
      if (!expired) {
        throw new ValidationError("Expired session not found or not yet expired", [{
          type: "invalid",
          message: "Expired session not found or not yet expired",
          path: "expired_session_id",
        }]);
      }
      parent_id = input.expired_session_id;
    }

    const expiresAt =
      input.expires_at ??
      new Date(
        Date.now() + DEFAULT_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
      ).toISOString();

    const session = await this.db
      .insertInto("sessions")
      .values({
        user_id: null,
        parent_id,
        expires_at: expiresAt,
        ip_address: input.ip_address ?? null,
        user_agent: input.user_agent ?? null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Failed to create session", [{
        type: "invalid",
        message: "Failed to create session",
        path: "session",
      }]);
    }

    return { id: session.id };
  }
}
