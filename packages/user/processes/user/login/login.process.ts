import {
  InjectDB,
  InjectJwt,
  InjectLogger,
  InjectPassword,
  InjectProcess,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  type Jwt,
  type Password,
} from "@danimai/core";
import { Kysely } from "kysely";
import type { Logger } from "@logtape/logtape";
import { CREATE_SESSION_PROCESS } from "../../session/create-session/create-session.process";
import type { CreateSessionProcess } from "../../session/create-session/create-session.process";
import { UPDATE_SESSION_PROCESS } from "../../session/update-session/update-session.process";
import type { UpdateSessionProcess } from "../../session/update-session/update-session.process";
import { LoginSchema } from "./login.schema";
import type { Database } from "../../../db/type";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_EXPIRY = "7d";
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 15 * 60; // 900

export interface LoginResult {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

export const LOGIN_PROCESS = Symbol("Login");

@Process(LOGIN_PROCESS)
export class LoginProcess implements ProcessContract<LoginResult> {
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectPassword()
    private readonly passwordService: Password,
    @InjectJwt()
    private readonly jwt: Jwt,
    @InjectProcess(CREATE_SESSION_PROCESS)
    private readonly createSessionProcess: CreateSessionProcess,
    @InjectProcess(UPDATE_SESSION_PROCESS)
    private readonly updateSessionProcess: UpdateSessionProcess
  ) { }

  async runOperations(@ProcessContext({
    schema: LoginSchema,
  }) context: ProcessContextType<typeof LoginSchema>) {
    const { input } = context;
    const email = input.email.trim().toLowerCase();

    const user = await this.db
      .withSchema("public")
      .selectFrom("users")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!user) {
      throw new ValidationError("Invalid email or password", [{
        type: "invalid",
        message: "Invalid email or password",
        path: "global",
      }]);
    }

    if (!user.password_hash) {
      throw new ValidationError("Invalid email or password", [{
        type: "invalid",
        message: "Invalid email or password",
        path: "global",
      }]);
    }

    const valid = await this.passwordService.verify(input.password.trim(), user.password_hash);
    if (!valid) {
      throw new ValidationError("Invalid email or password", [{
        type: "invalid",
        message: "Invalid email or password",
        path: "global",
      }]);
    }

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);

    const session = await this.createSessionProcess.runOperations({
      input: {
        user_id: user.id,
        expires_at: sessionExpiresAt.toISOString(),
      },
    });

    if (!session) {
      throw new ValidationError("Failed to create session", [{
        type: "invalid",
        message: "Failed to create session",
        path: "global",
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

    await this.updateSessionProcess.runOperations({
      input: { id: session.id, refresh_token },
    });

    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }
}
