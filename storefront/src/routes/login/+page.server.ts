import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms";
import { client } from "$lib/api/client";
import { treatyErrorMessage, type CustomerAuthTokens } from "$lib/account/storage";

const LoginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Please enter a valid email address."),
  password: z.string().min(1, "Please enter your password."),
});

export const load: PageServerLoad = async () => {
  const loginForm = await superValidate(zod4(LoginSchema));
  return { loginForm };
};

export const actions = {
  login: async ({ request }) => {
    const loginForm = await superValidate(request, zod4(LoginSchema));

    if (!loginForm.valid) {
      return fail(400, { loginForm });
    }

    const res = await client.storefront.auth.login.post({
      email: loginForm.data.email.trim().toLowerCase(),
      password: loginForm.data.password,
    });

    if (res.error) {
      return message(loginForm, treatyErrorMessage(res.error, "Login failed"), {
        status: 400,
      });
    }

    const authTokens = res.data as CustomerAuthTokens;
    return { loginForm, authTokens };
  },
} satisfies Actions;
