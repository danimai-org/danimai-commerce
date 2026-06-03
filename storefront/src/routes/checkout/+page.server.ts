import type { PageServerLoad } from "./$types";
import type { SuperValidated } from "sveltekit-superforms";
import { superValidate } from "sveltekit-superforms";
import { zod4 } from "sveltekit-superforms/adapters";
import { client } from "$lib/api/client.js";
import { rowsFromPaginated } from "$lib/api/storefront-api";
import {
	checkoutFormSchema,
	type CheckoutFormData,
} from "$lib/checkout/checkout-form-schema";
import {
	fetchAllCheckoutCountries,
	type CheckoutCountryOption,
} from "$lib/checkout/countries-api";
import type { PaymentProviderOption } from "$lib/checkout/payment-api";

async function loadActivePaymentProviders(): Promise<PaymentProviderOption[]> {
	try {
		const res = await client.storefront["payment-providers"].get({
			query: {
				page: 1,
				limit: 50,
				filters: { active: true },
			},
		});
		if (res.error || !res.data) return [];
		const { rows } = rowsFromPaginated<{ id: string; name: string }>(
			res.data,
		);
		return rows.map((row) => ({ id: row.id, name: row.name }));
	} catch {
		return [];
	}
}

export const load: PageServerLoad<{
	checkoutForm: SuperValidated<CheckoutFormData>;
	paymentProviders: PaymentProviderOption[];
	countries: CheckoutCountryOption[];
}> = async () => {
	const [paymentProviders, countries] = await Promise.all([
		loadActivePaymentProviders(),
		fetchAllCheckoutCountries(),
	]);
	const checkoutForm = await superValidate(zod4(checkoutFormSchema));
	if (paymentProviders.length > 0) {
		checkoutForm.data.paymentMethod = paymentProviders[0].id;
	}
	return { checkoutForm, paymentProviders, countries };
};
