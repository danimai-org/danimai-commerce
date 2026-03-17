import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  NotFoundError,
} from "@danimai/core";
import { Kysely, sql } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type UpdateUserProcessOutput,
  UpdateUserSchema,
} from "./update-user.schema";
import type { Database } from "../../../db/type";

export const UPDATE_USER_PROCESS = Symbol("UpdateUser");

@Process(UPDATE_USER_PROCESS)
export class UpdateUserProcess
  implements ProcessContract<typeof UpdateUserSchema, UpdateUserProcessOutput> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

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
      throw new NotFoundError("User not found");
    }


    const result = await this.db
      .updateTable("users")
      .set({
        ...input,
        updated_at: sql`now()`,
        id: undefined
      })
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .returningAll()
      .executeTakeFirst();

    if (!result) {
      return undefined;
    }

    return result;
  }
}
