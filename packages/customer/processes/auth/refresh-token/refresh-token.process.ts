import {
  InjectDB,
  InjectJwt,
  InjectProcess,
  Process,
  ProcessContext,
  type ProcessContextType,
  type ProcessContract,
  ValidationError,
  type Jwt,
} from "@danimai/core";
import { Kysely } from "kysely";
import { VALIDATE_CUSTOMER_SESSION_PROCESS } from "../../session/validate-session/validate-session.process";
import type { ValidateCustomerSessionProcess } from "../../session/validate-session/validate-session.process";
import { UPDATE_CUSTOMER_SESSION_PROCESS } from "../../session/update-session/update-session.process";
import type { UpdateCustomerSessionProcess } from "../../session/update-session/update-session.process";
import type { Database } from "../../../db/type";
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  ACCESS_TOKEN_EXPIRY,
  REFRESH_TOKEN_EXPIRY,
} from "../constants";
import {
  type RefreshCustomerTokenResult,
  RefreshCustomerTokenSchema,
} from "./refresh-token.schema";

const REFRESH_JWT_TYPE = "refresh";

/**
 * Exchanges a valid refresh JWT for new access and refresh tokens; rotates refresh token on the session.
 */
export const CUSTOMER_REFRESH_TOKEN_PROCESS = Symbol("CustomerRefreshToken");

@Process(CUSTOMER_REFRESH_TOKEN_PROCESS)
export class CustomerRefreshTokenProcess
  implements
    ProcessContract<typeof RefreshCustomerTokenSchema, RefreshCustomerTokenResult>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectJwt()
    private readonly jwt: Jwt,
    @InjectProcess(VALIDATE_CUSTOMER_SESSION_PROCESS)
    private readonly validateCustomerSessionProcess: ValidateCustomerSessionProcess,
    @InjectProcess(UPDATE_CUSTOMER_SESSION_PROCESS)
    private readonly updateCustomerSessionProcess: UpdateCustomerSessionProcess
  ) {}

  async runOperations(
    @ProcessContext({
      schema: RefreshCustomerTokenSchema,
    })
    context: ProcessContextType<typeof RefreshCustomerTokenSchema>
  ) {
    const { input } = context;
    let payload: Record<string, unknown>;
    try {
      payload = await this.jwt.verify(input.refresh_token.trim());
    } catch {
      throw new ValidationError("Invalid or expired refresh token", [
        {
          type: "invalid",
          message: "Invalid or expired refresh token",
          path: "refresh_token",
        },
      ]);
    }

    const type = payload.type;
    const sub = payload.sub;
    const sid = payload.sid;
    if (
      type !== REFRESH_JWT_TYPE ||
      typeof sub !== "string" ||
      typeof sid !== "string"
    ) {
      throw new ValidationError("Invalid refresh token", [
        {
          type: "invalid",
          message: "Invalid refresh token",
          path: "refresh_token",
        },
      ]);
    }

    const customer = await this.db
      .selectFrom("customers")
      .where("id", "=", sub)
      .where("deleted_at", "is", null)
      .select(["id", "email", "active"])
      .executeTakeFirst();

    if (!customer?.active) {
      throw new ValidationError("Invalid or expired refresh token", [
        {
          type: "invalid",
          message: "Invalid or expired refresh token",
          path: "refresh_token",
        },
      ]);
    }

    await this.validateCustomerSessionProcess.runOperations({
      input: {
        id: sid,
        customer_id: sub,
        refresh_token: input.refresh_token.trim(),
      },
    });

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);

    const access_token = await this.jwt.sign(
      { sub: customer.id, email: customer.email, sid },
      ACCESS_TOKEN_EXPIRY
    );
    const refresh_token = await this.jwt.sign(
      { sub: customer.id, type: REFRESH_JWT_TYPE, sid },
      REFRESH_TOKEN_EXPIRY
    );

    await this.updateCustomerSessionProcess.runOperations({
      input: {
        id: sid,
        refresh_token,
        expires_at: sessionExpiresAt.toISOString(),
      },
    });

    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }
}
