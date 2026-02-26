import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { getService } from "@danimai/core";
import {
  AuthTokensResponseSchema,
  EXPIRE_SESSION_PROCESS,
  ExpireSessionProcess,
  LOGIN_PROCESS,
  LoginProcess,
  LoginSchema,
  MeResponseSchema,
  REFRESH_TOKEN_PROCESS,
  RefreshTokenProcess,
  type RefreshTokenProcessInput,
  RefreshTokenSchema,
  RETRIEVE_USER_PROCESS,
  RetrieveUserProcess,
  VERIFY_ACCESS_TOKEN_PROCESS,
  VerifyAccessTokenProcess,
} from "@danimai/user";
import { handleProcessError } from "../../utils/error-handler";
import {
  InternalErrorResponseSchema,
  NoContentResponseSchema,
  UnauthorizedResponseSchema,
  ValidationErrorResponseSchema,
} from "../../utils/response-schemas";
import { loginRateLimitMacro } from "../../macros/login-rate-limit";

const loginRoute = new Elysia()
  .use(loginRateLimitMacro)
  .post(
    "/login",
    async ({ body: input }) => {
      const process = getService<LoginProcess>(LOGIN_PROCESS);
      return process.runOperations({ input });
    },
    {
      body: LoginSchema,
      rateLimit: true,
      response: {
        200: AuthTokensResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Auth"],
        summary: "Login",
        description: "Login with email and password",
      },
    }
  );
export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(bearer())
  .onError(({ error, set }) => handleProcessError(error, set))
  .use(loginRoute)
  .post(
    "/refresh",
    async ({ body }) => {
      const process = getService<RefreshTokenProcess>(REFRESH_TOKEN_PROCESS);
      const input = body as RefreshTokenProcessInput;
      return process.runOperations({ input });
    },
    {
      body: RefreshTokenSchema as any,
      response: {
        200: AuthTokensResponseSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Auth"],
        summary: "Refresh token",
        description: "Exchange refresh token for new access and refresh tokens",
      },
    }
  )
  .post(
    "/logout",
    async ({ bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return { error: "Unauthorized", message: "Missing Authorization header" };
      }
      const verifyProcess = getService<VerifyAccessTokenProcess>(VERIFY_ACCESS_TOKEN_PROCESS);
      const { sid } = await verifyProcess.runOperations({ input: { access_token: bearer } });
      if (sid) {
        const expireProcess = getService<ExpireSessionProcess>(EXPIRE_SESSION_PROCESS);
        await expireProcess.runOperations({ input: { id: sid } });
      }
      set.status = 204;
      return undefined;
    },
    {
      response: {
        204: NoContentResponseSchema,
        401: UnauthorizedResponseSchema,
      },
      detail: {
        tags: ["Auth"],
        summary: "Logout",
        description: "Expire current session (Bearer token required). Sets logged_out_at and expires session.",
      },
    }
  )
  .get(
    "/me",
    async ({ bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return { error: "Unauthorized", message: "Missing or invalid Authorization header" };
      }
      const verifyProcess = getService<VerifyAccessTokenProcess>(VERIFY_ACCESS_TOKEN_PROCESS);
      const { id } = await verifyProcess.runOperations({ input: { access_token: bearer } });
      const retrieveProcess = getService<RetrieveUserProcess>(RETRIEVE_USER_PROCESS);
      const user = await retrieveProcess.runOperations({ input: { id } });
      if (!user) return user;
      const { password_hash: _p, ...rest } = user;
      return rest;
    },
    {
      response: {
        200: MeResponseSchema,
        401: UnauthorizedResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Auth"],
        summary: "Current user",
        description: "Get current user from access token (Authorization: Bearer <token>)",
      },
    }
  );
