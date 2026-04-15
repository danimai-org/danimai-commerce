import type { Actions, PageServerLoad } from "./$types";
import { fail } from "@sveltejs/kit";
import { z } from "zod";
import { zod4 } from "sveltekit-superforms/adapters";
import { superValidate, message } from "sveltekit-superforms";
import { client } from "$lib/api/client";

// Define schema once for both server and client
const RegisterSchema = z.object({
  given_name: z
    .string()
    .min(3, "First name must be at least 3 characters")
    .max(50, "First name is too long"),
  family_name: z
    .string()
    .min(3, "Last name must be at least 3 characters")
    .max(50, "Last name is too long"),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(50, "Password is too long"),
});

export const load: PageServerLoad = async () => {
  // Initialize the form for the GET request
  const registerForm = await superValidate(zod4(RegisterSchema));
  return { registerForm };
};

export const actions = {
  register: async ({ request }) => {
    const registerForm = await superValidate(request, zod4(RegisterSchema));
    if (!registerForm.valid) {
      return fail(400, { registerForm });
    }
    try {
      const user = await client.users.post({
        first_name: registerForm.data.given_name,
        last_name: registerForm.data.family_name,
        email: registerForm.data.email,
        password: registerForm.data.password,
      });
      if (!user || user.error) {
        return message(
          registerForm,
          user?.error?.value?.message || "Registration failed",
          {
            status: 400,
          },
        );
      }
      return message(registerForm, "User registered successfully!");
    } catch (err) {
      return message(registerForm, "An unexpected error occurred", {
        status: 500,
      });
    }
  },
} satisfies Actions;
