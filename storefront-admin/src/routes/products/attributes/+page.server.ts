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


export const load: PageServerLoad = async () => {
    const attributeCreateForm = await superValidate(zod4(AttributeCreateSchema));
    return { attributeCreateForm };
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
        if (!attribute || attribute.error) {
            return fail(400, { error: 'Failed to create attribute' });
        }
        return message(attributeCreateForm, 'Attribute created successfully');

    },
   
   
} satisfies Actions;