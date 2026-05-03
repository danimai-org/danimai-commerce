import { getService, DANIMAI_JWT } from "@danimai/core";
import type { Jwt } from "@danimai/core";
import {
  VALIDATE_CUSTOMER_SESSION_PROCESS,
  type ValidateCustomerSessionProcess,
} from "@danimai/customer";

export type RequireCustomerResult =
  | { ok: true; customerId: string; sessionId: string }
  | {
      ok: false;
      status: 401;
      body: { error: string; message: string };
    };

export async function requireCustomerFromBearer(
  bearer: string | undefined
): Promise<RequireCustomerResult> {
  if (!bearer) {
    return {
      ok: false,
      status: 401,
      body: { error: "Unauthorized", message: "Missing Authorization header" },
    };
  }
  const jwt = getService<Jwt>(DANIMAI_JWT);
  let payload: Record<string, unknown>;
  try {
    payload = await jwt.verify(bearer);
  } catch {
    return {
      ok: false,
      status: 401,
      body: {
        error: "Unauthorized",
        message: "Invalid or expired access token",
      },
    };
  }
  const sub = payload.sub;
  const sid = payload.sid;
  if (typeof sub !== "string" || typeof sid !== "string") {
    return {
      ok: false,
      status: 401,
      body: { error: "Unauthorized", message: "Invalid access token" },
    };
  }
  const validateSession = getService<ValidateCustomerSessionProcess>(
    VALIDATE_CUSTOMER_SESSION_PROCESS
  );
  try {
    await validateSession.runOperations({
      input: { id: sid, customer_id: sub },
    });
  } catch {
    return {
      ok: false,
      status: 401,
      body: {
        error: "Unauthorized",
        message: "Invalid or expired session",
      },
    };
  }
  return { ok: true, customerId: sub, sessionId: sid };
}
