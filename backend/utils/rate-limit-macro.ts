import { Elysia } from "elysia";
import type { RateLimit } from "@danimai/core";

export type RateLimitContext = { body?: unknown; request?: Request };

/**
 * Elysia macro that runs a rate limit check before the handler.
 * If limited, responds with 429 and the given message; otherwise continues.
 */
export function rateLimitMacro(
  rateLimit: RateLimit,
  getKey: (ctx: RateLimitContext) => string | Promise<string>,
  options?: { message?: string }
) {
  const message = options?.message ?? "Too many attempts. Try again later.";
  return new Elysia().onBeforeHandle(async ({ body, request, set }) => {
    const key = await Promise.resolve(getKey({ body, request }));
    const { limited } = await rateLimit.consume(key);
    if (limited) {
      set.status = 429;
      return {
        error: "Too Many Requests",
        message,
      };
    }
  });
}
