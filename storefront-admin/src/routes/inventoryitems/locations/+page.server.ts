import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const stockLocationCreateDefaults = {
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
} as const;

const StockLocationCreateFormSchema = z.object({
	id: z.string().optional().default(''),
	name: z
		.string()
		.max(500, 'Name must be at most 500 characters')
		.refine((s) => s.trim().length > 0, { message: 'Name is required' }),
	address_1: z.string().max(500).optional().default(''),
	address_2: z.string().max(500).optional().default(''),
	company: z.string().max(200).optional().default(''),
	city: z.string().max(200).optional().default(''),
	province: z.string().max(200).optional().default(''),
	postal_code: z.string().max(50).optional().default(''),
	country_code: z.string().max(3).optional().default(''),
	phone: z.string().max(50).optional().default('')
});

export const load: PageServerLoad = async () => {
	const stockLocationCreateForm = await superValidate(
		{ ...stockLocationCreateDefaults },
		zod4(StockLocationCreateFormSchema)
	);
	return { stockLocationCreateForm };
};

function addressFromForm(data: z.infer<typeof StockLocationCreateFormSchema>) {
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

export const actions = {
	create: async ({ request }) => {
		const stockLocationCreateForm = await superValidate(
			request,
			zod4(StockLocationCreateFormSchema)
		);
		if (!stockLocationCreateForm.valid) {
			return fail(400, { stockLocationCreateForm });
		}
		const createRes = await client['stock-locations'].post({
			name: stockLocationCreateForm.data.name.trim() || null,
			address: addressFromForm(stockLocationCreateForm.data) ?? {},
			metadata: {}
		});
		if (createRes?.error) {
			const err = createRes.error as { value?: { message?: string } };
			return fail(400, {
				stockLocationCreateForm,
				error: String(err.value?.message ?? 'Failed to create stock location')
			});
		}
		return message(stockLocationCreateForm, 'Location created successfully');
	}
} satisfies Actions;
