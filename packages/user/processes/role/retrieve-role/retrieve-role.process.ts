import {
  InjectDB,
  InjectLogger,
  NotFoundError,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type RetrieveRoleProcessOutput,
  RetrieveRoleSchema,
} from "./retrieve-role.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the retrieve role process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const RETRIEVE_ROLE_PROCESS = Symbol("RetrieveRole");

@Process(RETRIEVE_ROLE_PROCESS)
export class RetrieveRoleProcess
  implements ProcessContract<typeof RetrieveRoleSchema, RetrieveRoleProcessOutput> {
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
    schema: RetrieveRoleSchema,
  }) context: ProcessContextType<typeof RetrieveRoleSchema>) {
    const { input } = context;

    const role = await this.db
      .selectFrom("roles")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!role) {
      throw new NotFoundError("Role not found");
    }

    return role;
  }
}
