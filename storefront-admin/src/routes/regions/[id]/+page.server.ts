import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const RegionUpdateSchema = z.object({
	id: z.string().min(1, 'Region id is required'),
	name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
	currency_code: z
		.string()
		.min(3, 'Currency code must be 3 characters (e.g. USD)')
		.max(3, 'Currency code must be 3 characters (e.g. USD)')
});

export const load: PageServerLoad = async () => {
	const regionUpdateForm = await superValidate(
		{ id: '', name: '', currency_code: '' },
		zod4(RegionUpdateSchema)
	);
	return { regionUpdateForm };
};

export const actions = {
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
