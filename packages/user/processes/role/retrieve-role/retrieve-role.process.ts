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
import { type RetrieveRoleProcessInput, RetrieveRoleSchema } from "./retrieve-role.schema";
import type { Database, Role } from "../../../db/type";

export const RETRIEVE_ROLE_PROCESS = Symbol("RetrieveRole");

@Process(RETRIEVE_ROLE_PROCESS)
export class RetrieveRoleProcess implements ProcessContract<Role | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

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
      throw new ValidationError("Role not found", [{
        type: "not_found",
        message: "Role not found",
        path: "id",
      }]);
    }

    return role;
  }
}
