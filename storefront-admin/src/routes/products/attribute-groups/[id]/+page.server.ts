import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import type { Actions, PageServerLoad } from './$types';


const AttributeGroupUpdateSchema = z.object({
	id: z.string(),
	title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	attribute_ids: z.array(z.string()).default([]),
	required: z.boolean().default(false),
	rank: z.number().default(0)
});


export const load: PageServerLoad = async () => {
	const attributeGroupUpdateForm = await superValidate(zod4(AttributeGroupUpdateSchema));
	return { attributeGroupUpdateForm };
};

export const actions = {

	update: async ({ request }) => {
		const attributeGroupUpdateForm = await superValidate(request, zod4(AttributeGroupUpdateSchema));

		if (!attributeGroupUpdateForm.valid) {
			return fail(400, { attributeGroupUpdateForm });
		}
		const id = attributeGroupUpdateForm.data.id;
		const attributeGroup = await client['product-attribute-groups']({ id }).put({
			id,
			title: attributeGroupUpdateForm.data.title.trim(),
			metadata: {
				rank: attributeGroupUpdateForm.data.rank,
			} as Record<string, any>,
			attributes: attributeGroupUpdateForm.data.attribute_ids.map((attribute_id) => ({ attribute_id })),
		});

		if (!attributeGroup || attributeGroup.error) {
			const error = attributeGroup?.error as { value?: { message?: string } } | undefined;
			return fail(400, {
				attributeGroupUpdateForm,
				error: error?.value?.message ?? 'Failed to update attribute group'
			});
		}
		return message(attributeGroupUpdateForm, 'Attribute group updated successfully');
	},
	
	
} satisfies Actions;
