import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const idJsonArray = (label: string) =>
	z.preprocess((value) => {
		if (Array.isArray(value)) return value;
		if (typeof value !== 'string') return [];
		try {
			const parsed = JSON.parse(value) as unknown;
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}, z.array(z.string().uuid(`${label} ID must be a valid UUID`)));

const ProductUpdateSchema = z.object({
	id: z.union([z.string().uuid(), z.literal('')]).default(''),
	status: z.enum(['draft', 'proposed', 'published', 'rejected']).default('draft'),
	title: z.string().min(3, 'Title must be at least 3 characters').max(255, 'Title is too long').default(''),
	subtitle: z.string().max(255, 'Subtitle is too long').default(''),
	handle: z.string().max(255, 'Handle is too long').default(''),
	description: z.string().max(4000, 'Description is too long').default(''),
	discountable: z.preprocess(
		(v) => (v === undefined || v === '' ? true : v === true || v === 'true'),
		z.boolean().default(true)
	),
	category_id: z.union([z.string().uuid(), z.literal('')]).default(''),
	collection_ids: idJsonArray('Collection').default([]),
	tag_ids: idJsonArray('Tag').default([]),
	attributes: z
		.array(
			z.object({
				attribute_group_id: z.string().uuid(),
				attribute_id: z.string().uuid(),
				value: z.string().default('')
			})
		)
		.default([])
});

export const load: PageServerLoad = async () => {
	const productUpdateForm = await superValidate(zod4(ProductUpdateSchema));
	
	return { productUpdateForm };
};

export const actions = {
	update: async ({ request }) => {
		const productUpdateForm = await superValidate(request, zod4(ProductUpdateSchema));

		if (!productUpdateForm.valid) {
			return fail(400, { productUpdateForm });
		}
		const {id, ...data} = productUpdateForm.data;
		const res = await client.products({ id }).put(data);

			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				return fail(400, {
					productUpdateForm,
					error: err.value?.message ?? 'Failed to update product'
				});
			}
			return message(productUpdateForm, 'Product updated successfully');
	},

	

	
} satisfies Actions;
