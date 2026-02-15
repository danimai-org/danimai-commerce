import {
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
import type { Logger } from "@logtape/logtape";
import { VALIDATE_SESSION_PROCESS } from "../../session/validate-session/validate-session.process";
import type { ValidateSessionProcess } from "../../session/validate-session/validate-session.process";
import {
  type VerifyAccessTokenProcessInput,
  VerifyAccessTokenSchema,
} from "./verify-access-token.schema";

export interface VerifyAccessTokenResult {
  id: string;
  sid?: string;
}

export const VERIFY_ACCESS_TOKEN_PROCESS = Symbol("VerifyAccessToken");

@Process(VERIFY_ACCESS_TOKEN_PROCESS)
export class VerifyAccessTokenProcess
  implements ProcessContract<VerifyAccessTokenResult>
{
  constructor(
    @InjectLogger()
    private readonly logger: Logger,
    @InjectJwt()
    private readonly jwt: Jwt,
    @InjectProcess(VALIDATE_SESSION_PROCESS)
    private readonly validateSessionProcess: ValidateSessionProcess
  ) {}

  async runOperations(@ProcessContext({
    schema: VerifyAccessTokenSchema,
  }) context: ProcessContextType<typeof VerifyAccessTokenSchema>) {
    const { input } = context;

    let payload: Record<string, unknown>;
    try {
      payload = await this.jwt.verify(input.access_token);
    } catch {
      throw new ValidationError("Invalid or expired access token", [{
        type: "invalid",
        message: "Invalid or expired access token",
        path: "access_token",
      }]);
    }

    const sub = payload.sub;
    if (typeof sub !== "string" || !sub) {
      throw new ValidationError("Invalid access token", [{
        type: "invalid",
        message: "Invalid access token",
        path: "access_token",
      }]);
    }

    const sid = payload.sid;
    if (typeof sid === "string" && sid) {
      try {
        await this.validateSessionProcess.runOperations({
          input: { id: sid, user_id: sub },
          logger: context.logger,
        });
      } catch {
        throw new ValidationError("Invalid or expired access token", [{
          type: "invalid",
          message: "Invalid or expired access token",
          path: "access_token",
        }]);
      }
    }

    return { id: sub, sid: typeof sid === "string" ? sid : undefined };
  }
}
