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
import { type DeleteRolesProcessInput, DeleteRolesSchema } from "./delete-roles.schema";
import type { Database } from "../../../db/type";

export const DELETE_ROLES_PROCESS = Symbol("DeleteRoles");

@Process(DELETE_ROLES_PROCESS)
export class DeleteRolesProcess implements ProcessContract<void> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: DeleteRolesSchema,
  }) context: ProcessContextType<typeof DeleteRolesSchema>): Promise<void> {
    const { input } = context;

    const roles = await this.db
      .selectFrom("roles")
      .where("id", "in", input.role_ids)
      .where("deleted_at", "is", null)
      .select("id")
      .execute();

    if (roles.length !== input.role_ids.length) {
      const foundIds = roles.map((r) => r.id);
      const missingIds = input.role_ids.filter((id) => !foundIds.includes(id));
      throw new ValidationError(
        `Roles not found: ${missingIds.join(", ")}`,
        [{
          type: "not_found",
          message: `Roles not found: ${missingIds.join(", ")}`,
          path: "role_ids",
        }]
      );
    }

    this.logger.info("Deleting roles", { role_ids: input.role_ids });

    await this.db
      .updateTable("roles")
      .set({ deleted_at: new Date().toISOString() })
      .where("id", "in", input.role_ids)
      .where("deleted_at", "is", null)
      .execute();
  }
}
