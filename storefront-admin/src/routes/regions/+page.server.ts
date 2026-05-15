import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

function parseCountryIdsField(raw: string | undefined): string[] {
	const s = (raw ?? '').trim();
	if (!s) return [];
	try {
		const parsed = JSON.parse(s) as unknown;
		return Array.isArray(parsed) ? parsed.map(String) : [];
	} catch {
		return [];
	}
}

const RegionCreateSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
	currency_code: z
		.string()
		.min(3, 'Currency code must be 3 characters (e.g. USD)')
		.max(3, 'Currency code must be 3 characters (e.g. USD)'),
	country_ids: z.string().optional().transform(parseCountryIdsField)
});

const RegionUpdateSchema = RegionCreateSchema.extend({
	id: z.string().min(1, 'Region id is required')
});

export const load: PageServerLoad = async () => {
	const regionCreateForm = await superValidate(
		{
			name: '',
			currency_code: '',
			country_ids: ''
		},
		zod4(RegionCreateSchema),
		{ errors: false }
	);

	const regionUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			currency_code: '',
			country_ids: ''
		},
		zod4(RegionUpdateSchema),
		{ errors: false }
	);

	return {
		regionCreateForm,
		regionUpdateForm
	};
};

export const actions = {
	create: async ({ request }) => {
		const regionCreateForm = await superValidate(request, zod4(RegionCreateSchema));

		if (!regionCreateForm.valid) {
			return fail(400, { regionCreateForm });
		}

		const region = await client['regions'].post({
			name: regionCreateForm.data.name.trim(),
			currency_code: regionCreateForm.data.currency_code.trim().toUpperCase(),
			metadata: {}
		});

		if (!region || region.error) {
			return fail(400, { regionCreateForm, error: 'Failed to create region' });
		}

		const created = region.data as { id: string } | undefined;
		if (!created?.id) {
			return fail(400, { regionCreateForm, error: 'Failed to create region' });
		}
		const ids = regionCreateForm.data.country_ids;
		if (ids.length > 0) {
			const assign = await client['regions']({ id: created.id }).countries.post({ ids });
			if (assign?.error) {
				return fail(400, {
					regionCreateForm,
					error: 'Region was created but assigning countries failed'
				});
			}
		}

		const out = message(regionCreateForm, 'Region created successfully');
		return { ...out, createdId: created.id };
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
