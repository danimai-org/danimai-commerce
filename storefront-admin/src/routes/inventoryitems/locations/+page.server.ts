import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const emptyForm = {
	id: '',
	name: '',
	address_1: '',
	address_2: '',
	company: '',
	city: '',
	province: '',
	postal_code: '',
	country_code: '',
	phone: ''
};

const StockLocationFormSchema = z.object({
	id: z.string().optional().default(''),
	name: z.string().max(500).optional().default(''),
	address_1: z.string().optional().default(''),
	address_2: z.string().optional().default(''),
	company: z.string().optional().default(''),
	city: z.string().optional().default(''),
	province: z.string().optional().default(''),
	postal_code: z.string().optional().default(''),
	country_code: z.string().optional().default(''),
	phone: z.string().optional().default('')
});

function addressFromForm(data: z.infer<typeof StockLocationFormSchema>) {
	const addressFields = {
		address_1: data.address_1.trim() || null,
		address_2: data.address_2.trim() || null,
		company: data.company.trim() || null,
		city: data.city.trim() || null,
		province: data.province.trim() || null,
		postal_code: data.postal_code.trim() || null,
		country_code: data.country_code.trim() || null,
		phone: data.phone.trim() || null
	};
	const hasAddress = Object.values(addressFields).some((v) => v != null && v !== '');
	return hasAddress ? addressFields : undefined;
}

export const load: PageServerLoad = async () => {
	const stockLocationForm = await superValidate(emptyForm, zod4(StockLocationFormSchema));
	return { stockLocationForm };
};

export const actions = {
	create: async ({ request }) => {
		const stockLocationForm = await superValidate(request, zod4(StockLocationFormSchema));
		if (!stockLocationForm.valid) {
			return fail(400, { stockLocationForm });
		}
		const createRes = await client['stock-locations'].post({
			name: stockLocationForm.data.name.trim() || null,
			address: addressFromForm(stockLocationForm.data) ?? {},
			metadata: {}
		});
		if (createRes?.error) {
			const err = createRes.error as { value?: { message?: string } };
			return fail(400, {
				stockLocationForm,
				error: String(err.value?.message ?? 'Failed to create stock location')
			});
		}
		return message(stockLocationForm, 'Location created successfully');
	},
	update: async ({ request }) => {
		const stockLocationForm = await superValidate(request, zod4(StockLocationFormSchema));
		if (!stockLocationForm.valid) {
			return fail(400, { stockLocationForm });
		}
		const id = stockLocationForm.data.id.trim();
		if (!id) {
			return fail(400, {
				stockLocationForm,
				error: 'Missing location id'
			});
		}
		const addr = addressFromForm(stockLocationForm.data);
		const updateRes = await client['stock-locations']({ id }).put({
			name: stockLocationForm.data.name.trim() || null,
			...(addr !== undefined ? { address: addr } : {})
		});
		if (updateRes?.error) {
			const err = updateRes.error as { value?: { message?: string } };
			return fail(400, {
				stockLocationForm,
				error: String(err.value?.message ?? 'Failed to update stock location')
			});
		}
		return message(stockLocationForm, 'Location updated successfully');
	}
} satisfies Actions;
