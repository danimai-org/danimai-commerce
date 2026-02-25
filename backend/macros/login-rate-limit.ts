import { RateLimit, MemoryRateLimitStore } from "@danimai/core";
import { rateLimitMacro } from "../utils/rate-limit-macro";

const loginRateLimit = new RateLimit(new MemoryRateLimitStore(), {
  windowMs: 15 * 60 * 1000,
  maxAttempts: 5,
});

export const loginRateLimitMacro = rateLimitMacro(
  loginRateLimit,
  ({ body }) => {
    const email = (body as { email?: string } | null)?.email;
    return "login:" + (typeof email === "string" ? email.trim().toLowerCase() : "unknown");
  },
  { message: "Too many login attempts. Try again later." }
);
