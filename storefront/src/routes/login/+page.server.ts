import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { zod4 } from "sveltekit-superforms/adapters";
import { message, superValidate } from "sveltekit-superforms";

const LoginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Please enter a valid email address."),
    password: z.string().trim().min(1, "Please enter your password."),
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

        return message(loginForm, "Login successful.");
    },
} satisfies Actions;
