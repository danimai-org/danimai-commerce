import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const emptyToUndefined = (v: unknown) =>
	typeof v === 'string' && v.trim() === '' ? undefined : v;

const StoreUpdateSchema = z.object({
	id: z.preprocess(emptyToUndefined, z.string().uuid().optional()),
	name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name is too long'),
	default_currency_code: z.string().max(32).optional().default(''),
	default_sales_channel_id: z.string().max(64).optional().default(''),
	default_region_id: z.string().max(64).optional().default(''),
	default_location_id: z.string().max(64).optional().default('')
});

export const load: PageServerLoad = async () => {
	const storeUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			default_currency_code: '',
			default_sales_channel_id: '',
			default_region_id: '',
			default_location_id: ''
		},
		zod4(StoreUpdateSchema)
	);
	return { storeUpdateForm };
};

export const actions = {
	updateStore: async ({ request }) => {
		const storeUpdateForm = await superValidate(request, zod4(StoreUpdateSchema));

		if (!storeUpdateForm.valid) {
			return fail(400, { storeUpdateForm });
		}

		const d = storeUpdateForm.data;
		const store = await client.stores.post({
			name: d.name.trim() || 'Store',
			default_currency_code: emptyToUndefined(d.default_currency_code) as string | undefined,
			default_sales_channel_id: emptyToUndefined(d.default_sales_channel_id) as string | undefined,
			default_region_id: emptyToUndefined(d.default_region_id) as string | undefined,
			default_location_id: emptyToUndefined(d.default_location_id) as string | undefined
		});

		if (!store.data) {
			return fail(400, { storeUpdateForm, error: 'Failed to update store' });
		}
		return message(storeUpdateForm, 'Store updated successfully');
	}
} satisfies Actions;
