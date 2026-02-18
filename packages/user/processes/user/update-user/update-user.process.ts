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
import { type UpdateUserProcessInput, UpdateUserSchema } from "./update-user.schema";
import type { Database, User } from "../../../db/type";

export const UPDATE_USER_PROCESS = Symbol("UpdateUser");

@Process(UPDATE_USER_PROCESS)
export class UpdateUserProcess implements ProcessContract<User | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) {}

  async runOperations(@ProcessContext({
    schema: UpdateUserSchema,
  }) context: ProcessContextType<typeof UpdateUserSchema>) {
    const { input } = context;

    const user = await this.db
      .selectFrom("users")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      throw new ValidationError("User not found", [{
        type: "not_found",
        message: "User not found",
        path: "id",
      }]);
    }

    const updateData: { first_name?: string | null; last_name?: string | null; role_id?: string | null } = {};
    if (input.first_name !== undefined) updateData.first_name = input.first_name;
    if (input.last_name !== undefined) updateData.last_name = input.last_name;
    if (input.role_id !== undefined) updateData.role_id = input.role_id;

    if (Object.keys(updateData).length === 0) {
      return user;
    }

    const result = await this.db
      .updateTable("users")
      .set(updateData)
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();

    return result;
  }
}
