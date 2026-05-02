import type { PageServerLoad } from "./$types";
import type { SuperValidated } from "sveltekit-superforms";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import {
	checkoutFormSchema,
	type CheckoutFormData,
} from "$lib/checkout/checkout-form-schema";

export const load: PageServerLoad<{ checkoutForm: SuperValidated<CheckoutFormData> }> =
	async () => {
		const checkoutForm = await superValidate(zod4(checkoutFormSchema));
		return { checkoutForm };
	};
