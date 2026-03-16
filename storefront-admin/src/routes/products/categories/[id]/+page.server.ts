import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';


const CategoryUpdateSchema = z.object({
    id: z.string(),
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name is too long"),
    handle: z.string().min(3, "Handle must be at least 3 characters").max(50, "Handle is too long"),
    description: z.string().min(3, "Description must be at least 3 characters").max(200, "Description is too long"),
    visibility: z.enum(['public', 'private']),
    status: z.enum(['active', 'inactive']),

});


export const load: PageServerLoad = async () => {
    const categoryUpdateForm = await superValidate(zod4(CategoryUpdateSchema));
    return { categoryUpdateForm };
};


export const actions = {

   
    update: async ({ request }) => {
        const categoryUpdateForm = await superValidate(request, zod4(CategoryUpdateSchema));
        if (!categoryUpdateForm.valid) {
            return fail(400, { categoryUpdateForm });
        }
        const category = await client['product-categories']({ id: categoryUpdateForm.data.id }).put({ value: categoryUpdateForm.data.name });
        if (!category) {
            return fail(400, { error: 'Failed to update category' });
        }   
        return message(categoryUpdateForm, 'Category updated successfully');
    }
   
} satisfies Actions;