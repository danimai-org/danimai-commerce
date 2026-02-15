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
import { type CreateRoleProcessInput, CreateRoleSchema } from "./create-role.schema";
import type { Database, Role } from "../../../db/type";

export const CREATE_ROLE_PROCESS = Symbol("CreateRole");

@Process(CREATE_ROLE_PROCESS)
export class CreateRoleProcess implements ProcessContract<Role | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

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
      .executeTakeFirst();
  }
}
