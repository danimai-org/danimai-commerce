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
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateRoleProcessOutput,
  UpdateRoleSchema,
} from "./update-role.schema";
import type { Database } from "../../../db/type";

export const UPDATE_ROLE_PROCESS = Symbol("UpdateRole");

@Process(UPDATE_ROLE_PROCESS)
export class UpdateRoleProcess
  implements ProcessContract<typeof UpdateRoleSchema, UpdateRoleProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdateRoleSchema,
  }) context: ProcessContextType<typeof UpdateRoleSchema>) {
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

    if (input.name) {
      const existing = await this.db
        .withSchema("public")
        .selectFrom("roles")
        .where("name", "=", input.name)
        .where("id", "!=", input.id)
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

    }


    return this.db
      .updateTable("roles")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
