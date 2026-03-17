import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import type { Actions, PageServerLoad } from './$types';

const TaxRegionCreateSchema = z.object({
	name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
	tax_provider_id: z.string().optional().default('')
});

const TaxRegionUpdateSchema = z.object({
	id: z.string().min(1, 'Tax region id is required'),
	name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
	tax_provider_id: z.string().optional().default('')
});

export const load: PageServerLoad = async () => {
	const taxRegionCreateForm = await superValidate(
		{
			name: '',
			tax_provider_id: ''
		},
		zod4(TaxRegionCreateSchema)
	);

	const taxRegionUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			tax_provider_id: ''
		},
		zod4(TaxRegionUpdateSchema)
	);

	return { taxRegionCreateForm, taxRegionUpdateForm };
};

export const actions = {
	create: async ({ request }) => {
		const taxRegionCreateForm = await superValidate(request, zod4(TaxRegionCreateSchema));
		if (!taxRegionCreateForm.valid) {
			return fail(400, { form: taxRegionCreateForm });
		}

		const taxRegion = await client['tax-regions'].post({
			tax_regions: [
				{
					name: taxRegionCreateForm.data.name.trim(),
					tax_provider_id: taxRegionCreateForm.data.tax_provider_id.trim() || null
				}
			]
		});

		if (!taxRegion || taxRegion.error) {
			return fail(400, { form: taxRegionCreateForm, error: 'Failed to create tax region' });
		}

		return message(taxRegionCreateForm, 'Tax region created successfully');
	},

	update: async ({ request }) => {
		const taxRegionUpdateForm = await superValidate(request, zod4(TaxRegionUpdateSchema));
		if (!taxRegionUpdateForm.valid) {
			return fail(400, { form: taxRegionUpdateForm });
		}

		const taxRegion = await client['tax-regions']({ id: taxRegionUpdateForm.data.id }).put({
			name: taxRegionUpdateForm.data.name.trim(),
			tax_provider_id: taxRegionUpdateForm.data.tax_provider_id.trim() || null
		});

		if (!taxRegion || taxRegion.error) {
			return fail(400, { form: taxRegionUpdateForm, error: 'Failed to update tax region' });
		}

		return message(taxRegionUpdateForm, 'Tax region updated successfully');
	}
} satisfies Actions;
