import {
  InjectDB,
  InjectLogger,
  InjectPassword,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  type Password,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { type AcceptInviteProcessInput, AcceptInviteSchema } from "./accept-invite.schema";
import type { Database, User } from "../../../db/type";

export const ACCEPT_INVITE_PROCESS = Symbol("AcceptInvite");

@Process(ACCEPT_INVITE_PROCESS)
export class AcceptInviteProcess implements ProcessContract<User | undefined> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectPassword()
    private readonly passwordService: Password
  ) { }

  async runOperations(@ProcessContext({
    schema: AcceptInviteSchema,
  }) context: ProcessContextType<typeof AcceptInviteSchema>) {
    const { input } = context;
    const token = input.token.trim();
    const now = new Date().toISOString();

    const invite = await this.db
      .selectFrom("invites")
      .where("token", "=", token)
      .where("deleted_at", "is", null)
      .where("accepted", "=", false)
      .where("expires_at", ">", now)
      .selectAll()
      .executeTakeFirst();

    if (!invite) {
      throw new ValidationError("Invalid or expired invite token", [{
        type: "invalid",
        message: "Invalid or expired invite token",
        path: "token",
      }]);
    }

    const email = invite.email.trim().toLowerCase();

    const existingUser = await this.db
      .selectFrom("users")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existingUser) {
      throw new ValidationError("A user with this email already exists", [{
        type: "not_unique",
        message: "A user with this email already exists",
        path: "email",
      }]);
    }

    let roleId: string | null = null;
    if (invite.role) {
      const role = await this.db
        .withSchema("public")
        .selectFrom("roles")
        .where("name", "=", invite.role)
        .where("deleted_at", "is", null)
        .select("id")
        .executeTakeFirst();
      roleId = role?.id ?? null;
    }

    const passwordHash = await this.passwordService.hash(input.password.trim());

    const user = await this.db
      .insertInto("users")
      .values({
        email,
        password_hash: passwordHash,
        role_id: roleId,
      })
      .returningAll()
      .executeTakeFirst();

    await this.db
      .updateTable("invites")
      .set({ accepted: true })
      .where("id", "=", invite.id)
      .execute();

    return user;
  }
}
