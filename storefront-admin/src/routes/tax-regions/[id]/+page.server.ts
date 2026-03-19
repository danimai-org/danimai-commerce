import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import type { Actions } from './$types';

const TaxRegionUpdateSchema = z.object({
	id: z.string().min(1, 'Tax region id is required'),
	name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name is too long'),
	tax_provider_id: z.string().optional().default('')
});

export const actions = {
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
