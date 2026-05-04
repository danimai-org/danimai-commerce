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
  type ExpireCustomerSessionProcessOutput,
  ExpireCustomerSessionSchema,
} from "./expire-session.schema";
import type { Database } from "../../../db/type";

/**
 * Ends a customer session by setting logged_out_at and expires_at to now.
 */
export const EXPIRE_CUSTOMER_SESSION_PROCESS = Symbol("ExpireCustomerSession");

@Process(EXPIRE_CUSTOMER_SESSION_PROCESS)
export class ExpireCustomerSessionProcess
  implements
    ProcessContract<
      typeof ExpireCustomerSessionSchema,
      ExpireCustomerSessionProcessOutput
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
      schema: ExpireCustomerSessionSchema,
    })
    context: ProcessContextType<typeof ExpireCustomerSessionSchema>
  ) {
    const { input } = context;
    const now = new Date().toISOString();

    const session = await this.db
      .updateTable("customer_sessions")
      .set({
        logged_out_at: now,
        expires_at: now,
        updated_at: new Date(),
      })
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
