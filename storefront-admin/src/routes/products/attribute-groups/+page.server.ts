import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import type { Actions, PageServerLoad } from './$types';

const AttributeGroupCreateSchema = z.object({
	title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	type: z.enum(['string', 'number', 'boolean', 'date']),
	attribute_ids: z.array(z.string()).default([]),
	required: z.boolean().default(false),
	rank: z.number().default(0)
});





export const load: PageServerLoad = async () => {
	const attributeGroupCreateForm = await superValidate(zod4(AttributeGroupCreateSchema));
	return { attributeGroupCreateForm };
};

export const actions = {
	create: async ({ request }) => {
		const form = await superValidate(request, zod4(AttributeGroupCreateSchema));

		if (!form.valid) {
			return fail(400, { form });
		}
		const attributeGroup = await client['product-attribute-groups'].post({
			title: form.data.title.trim(),
			attributes: form.data.attribute_ids.map((attribute_id) => ({ attribute_id })),
			metadata: {
				rank: form.data.rank,
			}
		});	
		if (!attributeGroup || attributeGroup.error) {
			return fail(400, { form, error: 'Failed to create attribute group' });
		}
		return message(form, 'Attribute group created successfully');
	},

	
} satisfies Actions;
