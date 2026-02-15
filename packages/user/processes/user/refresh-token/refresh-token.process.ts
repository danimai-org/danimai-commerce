import {
  InjectDB,
  InjectJwt,
  InjectLogger,
  InjectProcess,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  type Jwt,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import type { LoginResult } from "../login/login.process";
import { VALIDATE_SESSION_PROCESS } from "../../session/validate-session/validate-session.process";
import type { ValidateSessionProcess } from "../../session/validate-session/validate-session.process";
import { UPDATE_SESSION_PROCESS } from "../../session/update-session/update-session.process";
import type { UpdateSessionProcess } from "../../session/update-session/update-session.process";
import {
  type RefreshTokenProcessInput,
  RefreshTokenSchema,
} from "./refresh-token.schema";
import type { Database } from "../../../db/type";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60; // 900

export const REFRESH_TOKEN_PROCESS = Symbol("RefreshToken");

@Process(REFRESH_TOKEN_PROCESS)
export class RefreshTokenProcess implements ProcessContract<LoginResult> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectJwt()
    private readonly jwt: Jwt,
    @InjectProcess(VALIDATE_SESSION_PROCESS)
    private readonly validateSessionProcess: ValidateSessionProcess,
    @InjectProcess(UPDATE_SESSION_PROCESS)
    private readonly updateSessionProcess: UpdateSessionProcess
  ) { }

  async runOperations(@ProcessContext({
    schema: RefreshTokenSchema,
  }) context: ProcessContextType<typeof RefreshTokenSchema>) {
    const { input } = context;

    let payload: Record<string, unknown>;
    try {
      payload = await this.jwt.verify(input.refresh_token);
    } catch {
      throw new ValidationError("Invalid or expired refresh token", [{
        type: "invalid",
        message: "Invalid or expired refresh token",
        path: "refresh_token",
      }]);
    }

    if (payload.type !== "refresh") {
      throw new ValidationError("Invalid refresh token", [{
        type: "invalid",
        message: "Invalid refresh token",
        path: "refresh_token",
      }]);
    }

    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) {
      throw new ValidationError("Invalid refresh token", [{
        type: "invalid",
        message: "Invalid refresh token",
        path: "refresh_token",
      }]);
    }

    const sid = payload.sid;
    if (typeof sid !== "string" || !sid) {
      throw new ValidationError("Invalid refresh token", [{
        type: "invalid",
        message: "Invalid refresh token",
        path: "refresh_token",
      }]);
    }

    let session;
    try {
      session = await this.validateSessionProcess.runOperations({
        input: { id: sid, user_id: sub, refresh_token: input.refresh_token },
        logger: context.logger,
      });
    } catch {
      throw new ValidationError("Invalid or expired refresh token", [{
        type: "invalid",
        message: "Invalid or expired refresh token",
        path: "refresh_token",
      }]);
    }

    if (!session) {
      throw new ValidationError("Invalid or expired refresh token", [{
        type: "invalid",
        message: "Invalid or expired refresh token",
        path: "refresh_token",
      }]);
    }

    const user = await this.db
      .selectFrom("users")
      .where("id", "=", sub)
      .where("deleted_at", "is", null)
      .select(["id", "email"])
      .executeTakeFirst();

    if (!user) {
      throw new ValidationError("User no longer exists", [{
        type: "not_found",
        message: "User no longer exists",
        path: "refresh_token",
      }]);
    }

    const access_token = await this.jwt.sign(
      { sub: user.id, email: user.email, sid: session.id },
      ACCESS_TOKEN_EXPIRY
    );
    const refresh_token = await this.jwt.sign(
      { sub: user.id, type: "refresh", sid: session.id },
      REFRESH_TOKEN_EXPIRY
    );

    const newExpiresAt = new Date();
    newExpiresAt.setDate(newExpiresAt.getDate() + 7);
    await this.updateSessionProcess.runOperations({
      input: {
        id: session.id,
        refresh_token,
        expires_at: newExpiresAt.toISOString(),
      },
      logger: context.logger,
    });

    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }
}
