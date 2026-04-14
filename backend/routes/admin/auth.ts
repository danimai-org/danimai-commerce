import { Elysia } from "elysia";
import { bearer } from "@elysiajs/bearer";
import { type StaticDecode, Type } from "@sinclair/typebox";
import { getService } from "@danimai/core";
import {
  AuthTokensResponseSchema,
  CREATE_SESSION_PROCESS,
  CreateSessionProcess,
  CreateSessionResultSchema,
  EXPIRE_SESSION_PROCESS,
  ExpireSessionProcess,
  LOGIN_PROCESS,
  LoginProcess,
  LoginSchema,
  MeResponseSchema,
  REFRESH_TOKEN_PROCESS,
  RefreshTokenProcess,
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

const CreateSessionRouteBodySchema = Type.Object({
  ip_address: Type.Optional(Type.Union([Type.String(), Type.Null()])),
  user_agent: Type.Optional(Type.Union([Type.String(), Type.Null()])),
});

const loginRoute = new Elysia().use(loginRateLimitMacro).post(
  "/login",
  async ({ body }: { body: StaticDecode<typeof LoginSchema> }) => {
    const process = getService<LoginProcess>(LOGIN_PROCESS);
    return process.runOperations({ input: body });
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
  },
);
export const authRoutes = new Elysia({ prefix: "/auth" })
  .use(bearer())
  .onError(({ error, set }) => handleProcessError(error, set))
  .use(loginRoute)
  .post(
    "/sessions",
    async ({
      body,
      request,
    }: {
      body: StaticDecode<typeof CreateSessionRouteBodySchema>;
      request: Request;
    }) => {
      const process = getService<CreateSessionProcess>(CREATE_SESSION_PROCESS);
      return process.runOperations({
        input: {
          ip_address: body.ip_address ?? null,
          user_agent:
            body.user_agent ?? request.headers.get("user-agent") ?? null,
        },
      });
    },
    {
      body: CreateSessionRouteBodySchema,
      response: {
        200: CreateSessionResultSchema,
        400: ValidationErrorResponseSchema,
        500: InternalErrorResponseSchema,
      },
      detail: {
        tags: ["Auth"],
        summary: "Create session",
        description:
          "Create a session and return its id for use as session_id when creating a cart.",
      },
    },
  )
  .post(
    "/refresh",
    async ({ body }: { body: StaticDecode<typeof RefreshTokenSchema> }) => {
      const process = getService<RefreshTokenProcess>(REFRESH_TOKEN_PROCESS);
      return process.runOperations({ input: body });
    },
    {
      body: RefreshTokenSchema,
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
    },
  )
  .post(
    "/logout",
    async ({ bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "Missing Authorization header",
        };
      }
      const verifyProcess = getService<VerifyAccessTokenProcess>(
        VERIFY_ACCESS_TOKEN_PROCESS,
      );
      const { sid } = await verifyProcess.runOperations({
        input: { access_token: bearer },
      });
      if (sid) {
        const expireProcess = getService<ExpireSessionProcess>(
          EXPIRE_SESSION_PROCESS,
        );
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
        description:
          "Expire current session (Bearer token required). Sets logged_out_at and expires session.",
      },
    },
  )
  .get(
    "/me",
    async ({ bearer, set }) => {
      if (!bearer) {
        set.status = 401;
        return {
          error: "Unauthorized",
          message: "Missing or invalid Authorization header",
        };
      }
      const verifyProcess = getService<VerifyAccessTokenProcess>(
        VERIFY_ACCESS_TOKEN_PROCESS,
      );
      const { id } = await verifyProcess.runOperations({
        input: { access_token: bearer },
      });
      const retrieveProcess = getService<RetrieveUserProcess>(
        RETRIEVE_USER_PROCESS,
      );
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
        description:
          "Get current user from access token (Authorization: Bearer <token>)",
      },
    },
  );
