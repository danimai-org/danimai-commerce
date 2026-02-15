import { Elysia } from "elysia";
import { DANIMAI_LOGGER, getService, RateLimit, MemoryRateLimitStore } from "@danimai/core";
import type { Logger } from "@logtape/logtape";
import {
  EXPIRE_SESSION_PROCESS,
  ExpireSessionProcess,
  type ExpireSessionProcessInput,
  ExpireSessionSchema,
  LOGIN_PROCESS,
  LoginProcess,
  type LoginProcessInput,
  LoginSchema,
  REFRESH_TOKEN_PROCESS,
  RefreshTokenProcess,
  type RefreshTokenProcessInput,
  RefreshTokenSchema,
  RETRIEVE_USER_PROCESS,
  RetrieveUserProcess,
  type RetrieveUserProcessInput,
  RetrieveUserSchema,
  VERIFY_ACCESS_TOKEN_PROCESS,
  VerifyAccessTokenProcess,
  type VerifyAccessTokenProcessInput,
  VerifyAccessTokenSchema,
} from "@danimai/user";
import { handleProcessError } from "../utils/error-handler";
import Value from "typebox/value";

function getBearerToken(request: Request): string | null {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7).trim() || null;
}

const loginRateLimit = new RateLimit(new MemoryRateLimitStore(), {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
});

export const authRoutes = new Elysia({ prefix: "/auth" })
  .post(
    "/login",
    async ({ body, set }) => {
      const email = (body as { email?: string } | null)?.email;
      const key = "login:" + (typeof email === "string" ? email.trim().toLowerCase() : "unknown");
      const { limited } = await loginRateLimit.consume(key);
      if (limited) {
        set.status = 429;
        return {
          error: "Too Many Requests",
          message: "Too many login attempts. Try again later.",
        };
      }
      try {
        const process = getService<LoginProcess>(LOGIN_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(LoginSchema, body) as LoginProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["auth"],
        summary: "Login",
        description: "Authenticate with email and password",
        requestBody: {
          content: {
            "application/json": {
              example: { email: "user@example.com", password: "password" },
            },
          },
        },
      },
    }
  )
  .post(
    "/refresh",
    async ({ body, set }) => {
      try {
        const process = getService<RefreshTokenProcess>(REFRESH_TOKEN_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const input = Value.Convert(RefreshTokenSchema, body) as RefreshTokenProcessInput;
        const result = await process.runOperations({ input, logger });
        return result;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["auth"],
        summary: "Refresh token",
        description: "Exchange refresh token for new access and refresh tokens",
        requestBody: {
          content: {
            "application/json": {
              example: { refresh_token: "eyJ..." },
            },
          },
        },
      },
    }
  )
  .post(
    "/logout",
    async ({ request, set }) => {
      try {
        const access_token = getBearerToken(request);
        if (!access_token) {
          set.status = 401;
          return { error: "Unauthorized", message: "Missing Authorization header" };
        }
        const verifyProcess = getService<VerifyAccessTokenProcess>(VERIFY_ACCESS_TOKEN_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const verifyInput = Value.Convert(VerifyAccessTokenSchema, { access_token }) as VerifyAccessTokenProcessInput;
        const { sid } = await verifyProcess.runOperations({ input: verifyInput, logger });
        if (sid) {
          const expireProcess = getService<ExpireSessionProcess>(EXPIRE_SESSION_PROCESS);
          const expireInput = Value.Convert(ExpireSessionSchema, { id: sid }) as ExpireSessionProcessInput;
          await expireProcess.runOperations({ input: expireInput, logger });
        }
        set.status = 204;
        return undefined;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["auth"],
        summary: "Logout",
        description: "Expire current session (Bearer token required). Sets logged_out_at and expires session.",
      },
    }
  )
  .get(
    "/me",
    async ({ request, set }) => {
      try {
        const access_token = getBearerToken(request);
        if (!access_token) {
          set.status = 401;
          return { error: "Unauthorized", message: "Missing or invalid Authorization header" };
        }
        const verifyProcess = getService<VerifyAccessTokenProcess>(VERIFY_ACCESS_TOKEN_PROCESS);
        const logger = getService<Logger>(DANIMAI_LOGGER);
        const verifyInput = Value.Convert(VerifyAccessTokenSchema, { access_token }) as VerifyAccessTokenProcessInput;
        const { id } = await verifyProcess.runOperations({ input: verifyInput, logger });
        const retrieveProcess = getService<RetrieveUserProcess>(RETRIEVE_USER_PROCESS);
        const retrieveInput = Value.Convert(RetrieveUserSchema, { id }) as RetrieveUserProcessInput;
        const user = await retrieveProcess.runOperations({ input: retrieveInput, logger });
        if (!user) return user;
        const { password_hash: _p, ...rest } = user;
        return rest;
      } catch (err) {
        return handleProcessError(err, set);
      }
    },
    {
      detail: {
        tags: ["auth"],
        summary: "Current user",
        description: "Get current user from access token (Authorization: Bearer <token>)",
      },
    }
  );
