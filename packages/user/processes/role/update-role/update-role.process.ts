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
import { type UpdateRoleProcessInput, UpdateRoleSchema } from "./update-role.schema";
import type { Database, Role } from "../../../db/type";

export const UPDATE_ROLE_PROCESS = Symbol("UpdateRole");

@Process(UPDATE_ROLE_PROCESS)
export class UpdateRoleProcess implements ProcessContract<Role | undefined> {
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
      throw new ValidationError("Role not found", [{
        type: "not_found",
        message: "Role not found",
        path: "id",
      }]);
    }

    if (input.name !== undefined) {
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

    const updateData: { name?: string; description?: string } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    if (Object.keys(updateData).length === 0) {
      return role;
    }

    return this.db
      .updateTable("roles")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
