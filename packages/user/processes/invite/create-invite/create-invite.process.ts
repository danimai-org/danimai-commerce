import { randomBytes } from "node:crypto";
import {
  InjectDB,
  InjectLogger,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  InjectEmail,
  type EmailInterface,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import {
  type CreateInviteProcessInput,
  CreateInviteSchema,
} from "./create-invite.schema";
import type { Database, Invite } from "../../../db/type";

const INVITE_EXPIRY_DAYS = 7;

export const CREATE_INVITE_PROCESS = Symbol("CreateInvite");

@Process(CREATE_INVITE_PROCESS)
export class CreateInviteProcess implements ProcessContract<
  Invite | undefined
> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectEmail()
    private readonly emailService: EmailInterface,
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CreateInviteSchema,
    })
    context: ProcessContextType<typeof CreateInviteSchema>,
  ) {
    const { input } = context;
    const email = input.email.trim().toLowerCase();

    const existingUser = await this.db
      .selectFrom("users")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .select("id")
      .executeTakeFirst();

    if (existingUser) {
      throw new ValidationError("A user with this email already exists", [
        {
          type: "not_unique",
          message: "A user with this email already exists",
          path: "email",
        },
      ]);
    }

    const existingInvite = await this.db
      .selectFrom("invites")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .where("accepted", "=", false)
      .where("expires_at", ">", new Date().toISOString())
      .select("id")
      .executeTakeFirst();

    if (existingInvite) {
      throw new ValidationError(
        "A pending invite already exists for this email",
        [
          {
            type: "not_unique",
            message: "A pending invite already exists for this email",
            path: "email",
          },
        ],
      );
    }

    let roleName: string | null = null;
    if (input.role_id) {
      const role = await this.db
        .withSchema("public")
        .selectFrom("roles")
        .where("id", "=", input.role_id)
        .where("deleted_at", "is", null)
        .select("name")
        .executeTakeFirst();
      roleName = role?.name ?? null;
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await this.db
      .insertInto("invites")
      .values({
        email,
        role: roleName,
        accepted: false,
        token,
        expires_at: expiresAt.toISOString(),
        metadata: null,
      })
      .returningAll()
      .executeTakeFirst();

    const frontendUrl =
      (typeof process !== "undefined" && process.env?.FRONTEND_URL) ||
      (typeof Bun !== "undefined" && (Bun as any).env?.FRONTEND_URL) ||
      "";
    const base = frontendUrl.replace(/\/+$/, "");
    const inviteLink = base ? `${base}/accept-invite?token=${token}` : "";

    await this.emailService.sendEmail(email, {
      subject: "You're invited",
      template: "invite-user",
      context: {
        email,
        token,
        inviteLink,
        expiresAt: expiresAt.toISOString(),
        roleName: roleName ?? undefined,
      },
    });

    return invite;
  }
}
