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

const AttributeGroupUpdateSchema = z.object({
	id: z.string(),
	title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	attribute_ids: z.array(z.string()).default([]),
	required: z.boolean().default(false),
	rank: z.number().default(0)
});

const AttributeGroupDeleteSchema = z.object({
	id: z.string(),
	attribute_ids: z.array(z.string()).default([]),
	required: z.boolean().default(false),
	rank: z.number().default(0)
});


export const load: PageServerLoad = async () => {
	const attributeGroupCreateForm = await superValidate(zod4(AttributeGroupCreateSchema));
	const attributeGroupUpdateForm = await superValidate(zod4(AttributeGroupUpdateSchema));
	const attributeGroupDeleteForm = await superValidate(zod4(AttributeGroupDeleteSchema));
	return { attributeGroupCreateForm, attributeGroupUpdateForm, attributeGroupDeleteForm };
};

export const actions = {
	create: async ({ request }) => {
		const attributeGroupCreateForm = await superValidate(request, zod4(AttributeGroupCreateSchema));

		if (!attributeGroupCreateForm.valid) {
			return fail(400, { attributeGroupCreateForm });
		}
		const attributeGroup = await client['product-attribute-groups'].post({
			title: attributeGroupCreateForm.data.title.trim(),
			attributes: attributeGroupCreateForm.data.attribute_ids.map((attribute_id) => ({ attribute_id })),
			metadata: {
				required: attributeGroupCreateForm.data.required,
				rank: attributeGroupCreateForm.data.rank,
			}
		});	
		if (!attributeGroup) {
			return fail(400, { error: 'Failed to create attribute group' });
		}
		return message(attributeGroupCreateForm, 'Attribute group created successfully');
	},

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
				required: attributeGroupUpdateForm.data.required,
				rank: attributeGroupUpdateForm.data.rank,
			} as Record<string, any>,
			attributes: attributeGroupUpdateForm.data.attribute_ids.map((attribute_id) => ({ attribute_id })),
		});
		if (!attributeGroup) {
			return fail(400, { error: 'Failed to update attribute group' });
		}
		return message(attributeGroupUpdateForm, 'Attribute group updated successfully');
	},
	
	delete: async ({ request }) => {
		const attributeGroupDeleteForm = await superValidate(request, zod4(AttributeGroupDeleteSchema));

		if (!attributeGroupDeleteForm.valid) {
			return fail(400, { attributeGroupDeleteForm });
		}
		
		const attributeGroup = await client['product-attribute-groups'].delete({
			attribute_group_ids: [attributeGroupDeleteForm.data.id]
		});

		if (!attributeGroup) {
			return fail(400, { error: 'Failed to delete attribute group' });
		}
		return message(attributeGroupDeleteForm, 'Attribute group deleted successfully');
	}	
} satisfies Actions;
