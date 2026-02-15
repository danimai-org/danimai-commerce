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
import { type RetrievePermissionProcessInput, RetrievePermissionSchema } from "./retrieve-permission.schema";
import type { Database, Permission } from "../../../db/type";

export const RETRIEVE_PERMISSION_PROCESS = Symbol("RetrievePermission");

@Process(RETRIEVE_PERMISSION_PROCESS)
export class RetrievePermissionProcess
  implements ProcessContract<Permission | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger
  ) { }

  async runOperations(@ProcessContext({
    schema: RetrievePermissionSchema,
  }) context: ProcessContextType<typeof RetrievePermissionSchema>) {
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

    return permission;
  }
}
