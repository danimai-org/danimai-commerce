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
  type CreateRoleProcessOutput,
  CreateRoleSchema,
} from "./create-role.schema";
import type { Database } from "../../../db/type";

/**
 * Handles the create role process.
 * Input: validated process context input for this operation.
 * Output: process-specific result data for downstream callers.
 */
export const CREATE_ROLE_PROCESS = Symbol("CreateRole");

@Process(CREATE_ROLE_PROCESS)
export class CreateRoleProcess
  implements ProcessContract<typeof CreateRoleSchema, CreateRoleProcessOutput> {
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
    schema: CreateRoleSchema,
  }) context: ProcessContextType<typeof CreateRoleSchema>) {
    const { input } = context;

    const existing = await this.db
      .selectFrom("roles")
      .where("name", "=", input.name)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existing) {
      throw new ValidationError("Role with this name already exists", [{
        type: "not_found",
        message: "Role with this name already exists",
        path: "name",
      }]);
    }

    return this.db
      .insertInto("roles")
      .values({
        name: input.name,
        description: input.description ?? "",
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  }
}
