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
import { CREATE_CUSTOMER_SESSION_PROCESS } from "../../session/create-session/create-session.process";
import type { CreateCustomerSessionProcess } from "../../session/create-session/create-session.process";
import { UPDATE_CUSTOMER_SESSION_PROCESS } from "../../session/update-session/update-session.process";
import type { UpdateCustomerSessionProcess } from "../../session/update-session/update-session.process";
import type { Database } from "../../../db/type";
import {
  ACCESS_TOKEN_EXPIRES_IN_SECONDS,
  ACCESS_TOKEN_EXPIRY,
  PASSWORD_PROVIDER_NAME,
  PASSWORD_PROVIDER_TYPE,
  REFRESH_TOKEN_EXPIRY,
} from "../constants";
import {
  type CustomerLoginResult,
  CustomerLoginSchema,
} from "./login.schema";

/**
 * Email/password login for active customers; issues JWTs with sid = customer_sessions.id.
 */
export const CUSTOMER_LOGIN_PROCESS = Symbol("CustomerLogin");

@Process(CUSTOMER_LOGIN_PROCESS)
export class CustomerLoginProcess
  implements ProcessContract<typeof CustomerLoginSchema, CustomerLoginResult>
{
  constructor(
    @InjectDB()
    private readonly db: Kysely<Database>,
    @InjectLogger()
    private readonly logger: Logger,
    @InjectPassword()
    private readonly passwordService: Password,
    @InjectJwt()
    private readonly jwt: Jwt,
    @InjectProcess(CREATE_CUSTOMER_SESSION_PROCESS)
    private readonly createCustomerSessionProcess: CreateCustomerSessionProcess,
    @InjectProcess(UPDATE_CUSTOMER_SESSION_PROCESS)
    private readonly updateCustomerSessionProcess: UpdateCustomerSessionProcess
  ) {}

  async runOperations(
    @ProcessContext({
      schema: CustomerLoginSchema,
    })
    context: ProcessContextType<typeof CustomerLoginSchema>
  ) {
    const { input } = context;
    const email = input.email.trim().toLowerCase();

    const customer = await this.db
      .selectFrom("customers")
      .where("email", "=", email)
      .where("deleted_at", "is", null)
      .selectAll()
      .executeTakeFirst();

    if (!customer) {
      throw new ValidationError("Invalid email or password", [
        {
          type: "invalid",
          message: "Invalid email or password",
          path: "global",
        },
      ]);
    }

    if (!customer.active) {
      throw new ValidationError("Account is not active", [
        {
          type: "invalid",
          message: "Account is not active",
          path: "global",
        },
      ]);
    }

    const provider = await this.db
      .selectFrom("auth_providers")
      .where("customer_id", "=", customer.id)
      .where("provider_type", "=", PASSWORD_PROVIDER_TYPE)
      .where("provider_name", "=", PASSWORD_PROVIDER_NAME)
      .selectAll()
      .executeTakeFirst();

    if (!provider?.password_hash) {
      throw new ValidationError("Invalid email or password", [
        {
          type: "invalid",
          message: "Invalid email or password",
          path: "global",
        },
      ]);
    }

    const valid = await this.passwordService.verify(
      input.password.trim(),
      provider.password_hash
    );
    if (!valid) {
      throw new ValidationError("Invalid email or password", [
        {
          type: "invalid",
          message: "Invalid email or password",
          path: "global",
        },
      ]);
    }

    const sessionExpiresAt = new Date();
    sessionExpiresAt.setDate(sessionExpiresAt.getDate() + 7);

    const session = await this.createCustomerSessionProcess.runOperations({
      input: {
        expires_at: sessionExpiresAt.toISOString(),
      },
    });

    if (!session) {
      throw new ValidationError("Failed to create session", [
        {
          type: "invalid",
          message: "Failed to create session",
          path: "global",
        },
      ]);
    }

    const access_token = await this.jwt.sign(
      { sub: customer.id, email: customer.email, sid: session.id },
      ACCESS_TOKEN_EXPIRY
    );
    const refresh_token = await this.jwt.sign(
      { sub: customer.id, type: "refresh", sid: session.id },
      REFRESH_TOKEN_EXPIRY
    );

    await this.updateCustomerSessionProcess.runOperations({
      input: {
        id: session.id,
        customer_id: customer.id,
        refresh_token,
      },
    });

    return {
      access_token,
      refresh_token,
      expires_in: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }
}
