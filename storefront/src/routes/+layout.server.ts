import { client } from "$lib/api/client";
import {
  SESSION_COOKIE_KEY,
  SESSION_COOKIE_MAX_AGE_SECONDS,
} from "$lib/constants/session";
import { saveInLocalStorage, type Cart } from "$lib/hooks/use-cart.hook";
import type { LayoutServerLoad } from "./$types";

function treatyErrorMessage(err: unknown): string {
  const o = err as { value?: { message?: string } };
  return o?.value?.message ?? String(err);
}

export const load: LayoutServerLoad = async ({ cookies, request }) => {
  const existingSessionId = cookies.get(SESSION_COOKIE_KEY);
  if (existingSessionId) return {};

  const forwardedFor = request.headers.get("x-forwarded-for") ?? "";
  const ipAddress = forwardedFor.split(",")[0]?.trim() ?? "";
  const userAgent = request.headers.get("user-agent") ?? "";

  const res = await client.admin.auth.sessions.post({
    ip_address: ipAddress,
    user_agent: userAgent,
  });

  if (res.error) {
    throw new Error(treatyErrorMessage(res.error));
  }

  // create empty cart
  const cart = await client.admin.carts.post({
    session_id: res.data.id,
  });

  if (cart.error) {
    throw new Error(treatyErrorMessage(cart.error));
  }

  saveInLocalStorage(cart.data as Cart);

  const data = res.data as { id: string };
  cookies.set(SESSION_COOKIE_KEY, data.id, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: request.url.startsWith("https://"),
    maxAge: SESSION_COOKIE_MAX_AGE_SECONDS,
  });

  return {};
};
