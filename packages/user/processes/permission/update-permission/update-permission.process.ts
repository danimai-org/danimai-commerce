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
import { type UpdatePermissionProcessInput, UpdatePermissionSchema } from "./update-permission.schema";
import type { Database, Permission } from "../../../db/type";

export const UPDATE_PERMISSION_PROCESS = Symbol("UpdatePermission");

@Process(UPDATE_PERMISSION_PROCESS)
export class UpdatePermissionProcess implements ProcessContract<Permission | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: UpdatePermissionSchema,
  }) context: ProcessContextType<typeof UpdatePermissionSchema>) {
    const { input } = context;

    const permission = await this.db
      .selectFrom("permissions")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!permission) {
      throw new ValidationError("Permission not found", [{
        type: "not_found",
        message: "Permission not found",
        path: "id",
      }]);
    }

    if (input.name !== undefined) {
      const existing = await this.db
        .withSchema("public")
        .selectFrom("permissions")
        .where("name", "=", input.name)
        .where("id", "!=", input.id)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();
      if (existing) {
        throw new ValidationError("Permission with this name already exists", [{
          type: "not_found",
          message: "Permission with this name already exists",
          path: "name",
        }]);
      }
    }

    const updateData: { name?: string; description?: string } = {};
    if (input.name !== undefined) updateData.name = input.name;
    if (input.description !== undefined) updateData.description = input.description;

    if (Object.keys(updateData).length === 0) {
      return permission;
    }

    return this.db
      .updateTable("permissions")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();
  }
}
