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
  type CreateCustomerSessionProcessOutput,
  CreateCustomerSessionSchema,
  DEFAULT_CUSTOMER_SESSION_TTL_DAYS,
} from "./create-session.schema";
import type { Database } from "../../../db/type";

/**
 * Creates a customer_sessions row (customer_id may be set later at login).
 */
export const CREATE_CUSTOMER_SESSION_PROCESS = Symbol("CreateCustomerSession");

@Process(CREATE_CUSTOMER_SESSION_PROCESS)
export class CreateCustomerSessionProcess
  implements
    ProcessContract<
      typeof CreateCustomerSessionSchema,
      CreateCustomerSessionProcessOutput
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
      schema: CreateCustomerSessionSchema,
    })
    context: ProcessContextType<typeof CreateCustomerSessionSchema>
  ) {
    const { input } = context;

    const expiresAt = new Date(
      Date.now() + DEFAULT_CUSTOMER_SESSION_TTL_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    const session = await this.db
      .insertInto("customer_sessions")
      .values({
        customer_id: null,
        parent_id: null,
        expires_at: expiresAt,
        ip_address: input.ip_address ?? null,
        user_agent: input.user_agent ?? null,
      })
      .returningAll()
      .executeTakeFirst();

    if (!session) {
      throw new ValidationError("Failed to create session", [
        {
          type: "invalid",
          message: "Failed to create session",
          path: "session",
        },
      ]);
    }

    return { id: session.id };
  }
}
