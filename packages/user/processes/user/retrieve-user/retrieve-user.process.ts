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
  type RetrieveUserProcessInput,
  RetrieveUserSchema,
} from "./retrieve-user.schema";
import type { Database, User } from "../../../db/type";

export const RETRIEVE_USER_PROCESS = Symbol("RetrieveUser");

@Process(RETRIEVE_USER_PROCESS)
export class RetrieveUserProcess implements ProcessContract<User | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrieveUserSchema,
  }) context: ProcessContextType<typeof RetrieveUserSchema>) {
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

    return user;
  }
}
