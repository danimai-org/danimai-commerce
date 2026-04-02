import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const PriceListCreateSchema = z.object({
	name: z.string().min(2, 'Name is required').max(200, 'Name is too long'),
	description: z.string().max(500, 'Description is too long').optional().default(''),
	type: z.enum(['sale', 'override']).default('sale'),
	status: z.enum(['active', 'draft']).default('active'),
	starts_at: z.string().optional().default(''),
	ends_at: z.string().optional().default('')
});

const PriceListUpdateSchema = z.object({
	id: z.string().min(1),
	name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
	description: z.string().max(500, 'Description is too long').optional().default(''),
	type: z.enum(['sale', 'override']),
	status: z.enum(['active', 'draft']),
	starts_at: z.string().optional().default(''),
	ends_at: z.string().optional().default('')
});

function nullableDate(s: string): string | null {
	const t = s.trim();
	return t ? t : null;
}

export const load: PageServerLoad = async () => {
	const priceListCreateForm = await superValidate(
		{
			name: '',
			description: '',
			type: 'sale' as const,
			status: 'active' as const,
			starts_at: '',
			ends_at: ''
		},
		zod4(PriceListCreateSchema),
		{ errors: false }
	);
	const priceListUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			description: '',
			type: 'sale' as const,
			status: 'active' as const,
			starts_at: '',
			ends_at: ''
		},
		zod4(PriceListUpdateSchema),
		{ errors: false }
	);
	return { priceListCreateForm, priceListUpdateForm };
};

export const actions = {
	create: async ({ request }) => {
		const priceListCreateForm = await superValidate(request, zod4(PriceListCreateSchema));
		if (!priceListCreateForm.valid) {
			return fail(400, { priceListCreateForm });
		}
		const d = priceListCreateForm.data;
		const created = await client['price-lists'].post({
			name: d.name.trim(),
			description: d.description.trim() || null,
			type: d.type,
			status: d.status,
			starts_at: nullableDate(d.starts_at ?? ''),
			ends_at: nullableDate(d.ends_at ?? '')
		});
		if (!created) {
			return fail(400, { priceListCreateForm });
		}
		return message(priceListCreateForm, 'Price list created successfully');
	},
	update: async ({ request }) => {
		const priceListUpdateForm = await superValidate(request, zod4(PriceListUpdateSchema));
		if (!priceListUpdateForm.valid) {
			return fail(400, { priceListUpdateForm });
		}
		const d = priceListUpdateForm.data;
		const updated = await client['price-lists']({ id: d.id }).put({
			name: d.name.trim(),
			description: d.description.trim() || null,
			type: d.type,
			status: d.status,
			starts_at: nullableDate(d.starts_at ?? ''),
			ends_at: nullableDate(d.ends_at ?? '')
		});
		if (!updated) {
			return fail(400, { priceListUpdateForm });
		}
		return message(priceListUpdateForm, 'Price list updated successfully');
	}
} satisfies Actions;
