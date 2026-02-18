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
  type ResendInviteProcessInput,
  ResendInviteSchema,
} from "./resend-invite.schema";
import type { Database, Invite } from "../../../db/type";

const INVITE_EXPIRY_DAYS = 7;

export const RESEND_INVITE_PROCESS = Symbol("ResendInvite");

@Process(RESEND_INVITE_PROCESS)
export class ResendInviteProcess implements ProcessContract<
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
      schema: ResendInviteSchema,
    })
    context: ProcessContextType<typeof ResendInviteSchema>,
  ) {
    const { input } = context;

    const existing = await this.db
      .selectFrom("invites")
      .where("id", "=", input.id)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!existing) {
      throw new ValidationError("Invite not found", [
        {
          type: "not_found",
          message: "Invite not found",
          path: "id",
        },
      ]);
    }

    if (existing.accepted) {
      throw new ValidationError("Invite has already been accepted", [
        {
          type: "invalid_state",
          message: "Invite has already been accepted",
          path: "id",
        },
      ]);
    }

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRY_DAYS);

    const invite = await this.db
      .updateTable("invites")
      .set({
        token,
        expires_at: expiresAt.toISOString(),
      })
      .where("id", "=", input.id)
      .returningAll()
      .executeTakeFirst();

    const frontendUrl =
      (typeof process !== "undefined" && process.env?.FRONTEND_URL) ||
      (typeof Bun !== "undefined" && (Bun as any).env?.FRONTEND_URL) ||
      "";
    const base = frontendUrl.replace(/\/+$/, "");
    const inviteLink = base ? `${base}/accept-invite?token=${token}` : "";

    await this.emailService.sendEmail(existing.email, {
      subject: "You're invited",
      template: "invite-user",
      context: {
        email: existing.email,
        token,
        inviteLink,
        expiresAt: expiresAt.toISOString(),
        roleName: existing.role ?? undefined,
      },
    });

    return invite;
  }
}
