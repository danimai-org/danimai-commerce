import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const RegionCreateSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name is too long'),
    currency_code: z.string().min(3, 'Currency code must be at least 3 characters').max(3, 'Currency code is too long')
});

const RegionUpdateSchema = RegionCreateSchema.extend({
    id: z.string().min(1, 'Region id is required')
});

export const load: PageServerLoad = async () => {
	const regionCreateForm = await superValidate(
		{
			name: '',
			currency_code: ''
		},
		zod4(RegionCreateSchema)
	);

	const regionUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			currency_code: ''
		},
		zod4(RegionUpdateSchema)
	);

	return { regionCreateForm, regionUpdateForm };
};

export const actions = {

	create: async ({ request }) => {
		const regionCreateForm = await superValidate(request, zod4(RegionCreateSchema));

		if (!regionCreateForm.valid) {
			return fail(400, { regionCreateForm });
		}

		const region = await client['regions'].post({
			regions: [
				{
					name: regionCreateForm.data.name.trim(),
					currency_code: regionCreateForm.data.currency_code.trim().toUpperCase()
				}
			]
		});

		if (!region || region.error) {
			return fail(400, { regionCreateForm, error: 'Failed to create region' });
		}

		return message(regionCreateForm, 'Region created successfully');
	},
	update: async ({ request }) => {
		const regionUpdateForm = await superValidate(request, zod4(RegionUpdateSchema));

		if (!regionUpdateForm.valid) {
			return fail(400, { regionUpdateForm });
		}

		const region = await client['regions']({ id: regionUpdateForm.data.id }).put({
			name: regionUpdateForm.data.name.trim(),
			currency_code: regionUpdateForm.data.currency_code.trim().toUpperCase()
		});

		if (!region || region.error) {
			return fail(400, { regionUpdateForm, error: 'Failed to update region' });
		}

		return message(regionUpdateForm, 'Region updated successfully');
	}
} satisfies Actions;