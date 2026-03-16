import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';



const AttributeUpdateSchema = z.object({
    id: z.string(),
    title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
    type: z.string().min(3, "Type must be at least 3 characters").max(50, "Type is too long"),
});



export const load: PageServerLoad = async () => {
    const attributeUpdateForm = await superValidate(zod4(AttributeUpdateSchema));
    return {  attributeUpdateForm, };
};


export const actions = {

    update: async ({ request }) => {
        const attributeUpdateForm = await superValidate(request, zod4(AttributeUpdateSchema));
        if (!attributeUpdateForm.valid) {
            return fail(400, { attributeUpdateForm });
        }
        const attribute = await client['product-attributes']({ id: attributeUpdateForm.data.id }).put({
            id: attributeUpdateForm.data.id,
            title: attributeUpdateForm.data.title.trim(),
            type: attributeUpdateForm.data.type.trim(),
        });
        if (!attribute) {
            return fail(400, { error: 'Failed to update attribute' });
        }
        return message(attributeUpdateForm, 'Attribute updated successfully');
    },
   
} satisfies Actions;