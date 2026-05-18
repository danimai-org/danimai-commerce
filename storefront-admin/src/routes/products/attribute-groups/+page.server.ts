import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client.js';
import type { Actions, PageServerLoad } from './$types';

const AttributeGroupCreateSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	type: z.enum(['string', 'number', 'boolean', 'date']),
	attribute_ids: z.array(z.string()).default([]),
	attributes_required_json: z.string().default('{}'),
	rank: z.number().default(0)
});

export const load: PageServerLoad = async () => {
	const attributeGroupCreateForm = await superValidate(zod4(AttributeGroupCreateSchema));
	return { attributeGroupCreateForm };
};

export const actions = {
	create: async ({ request }) => {
		const attributeGroupCreateForm = await superValidate(request, zod4(AttributeGroupCreateSchema));

		if (!attributeGroupCreateForm.valid) {
			return fail(400, { attributeGroupCreateForm });
		}
		let requiredById: Record<string, boolean> = {};
		try {
			const parsed = JSON.parse(
				attributeGroupCreateForm.data.attributes_required_json || '{}'
			) as unknown;
			if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
				for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
					if (typeof v === 'boolean') requiredById[k] = v;
				}
			}
		} catch {
			requiredById = {};
		}
		const res = await client['product-attribute-groups'].post({
			title: attributeGroupCreateForm.data.title.trim(),
			attributes: attributeGroupCreateForm.data.attribute_ids.map((attribute_id) => ({
				attribute_id,
				required: requiredById[attribute_id] ?? false
			})),
			metadata: {
				rank: attributeGroupCreateForm.data.rank
			}
		});
		if (res.error) {
			return fail(400, { attributeGroupCreateForm, error: 'Failed to create attribute group' });
		}
		return message(attributeGroupCreateForm, 'Attribute group created successfully');
	}
} satisfies Actions;
