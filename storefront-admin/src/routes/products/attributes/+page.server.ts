import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const AttributeCreateSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
    type: z.enum(['string', 'number', 'boolean', 'date']),
});

const AttributeUpdateSchema = z.object({
    id: z.string(),
    title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
});

const AttributeDeleteSchema = z.object({
    id: z.string(),
});

export const load: PageServerLoad = async () => {
    const attributeCreateForm = await superValidate(zod4(AttributeCreateSchema));
    const attributeUpdateForm = await superValidate(zod4(AttributeUpdateSchema));
    const attributeDeleteForm = await superValidate(zod4(AttributeDeleteSchema));
    return { attributeCreateForm, attributeUpdateForm, attributeDeleteForm };
};


export const actions = {

    create: async ({ request }) => {
        const attributeCreateForm = await superValidate(request, zod4(AttributeCreateSchema));

        if (!attributeCreateForm.valid) {
            return fail(400, { attributeCreateForm });
        }
        const attribute = await client['product-attributes'].post({
            title: attributeCreateForm.data.title.trim(),
            type: attributeCreateForm.data.type ?? 'string'
        });
        if (!attribute) {
            return fail(400, { error: 'Failed to create attribute' });
        }
        return message(attributeCreateForm, 'Attribute created successfully');

    },
    update: async ({ request }) => {
        const attributeUpdateForm = await superValidate(request, zod4(AttributeUpdateSchema));
        if (!attributeUpdateForm.valid) {
            return fail(400, { attributeUpdateForm });
        }
        const attribute = await client['product-attributes']({ id: attributeUpdateForm.data.id }).put({
            id: attributeUpdateForm.data.id,
            title: attributeUpdateForm.data.title.trim(),
        });
        if (!attribute) {
            return fail(400, { error: 'Failed to update attribute' });
        }
        return message(attributeUpdateForm, 'Attribute updated successfully');
    },
    delete: async ({ request }) => {
        const attributeDeleteForm = await superValidate(request, zod4(AttributeDeleteSchema));
        if (!attributeDeleteForm.valid) {
            return fail(400, { attributeDeleteForm });
        }
        const attribute = await client['product-attributes'].delete(
            {
                attribute_ids: [attributeDeleteForm.data.id]
            }
        );
        if (!attribute) {
            return fail(400, { error: 'Failed to delete attribute' });
        }
        return message(attributeDeleteForm, 'Attribute deleted successfully');
    }
} satisfies Actions;