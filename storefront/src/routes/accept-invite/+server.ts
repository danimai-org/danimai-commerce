import { redirect } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = ({ url }) => {
  const adminBase =
    env.ADMIN_FRONTEND_URL?.replace(/\/+$/, "") ?? "http://localhost:4000";
  redirect(302, `${adminBase}/accept-invite${url.search}`);
};
