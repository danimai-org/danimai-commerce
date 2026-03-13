import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const CategoryCreateSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(50, "Name is too long"),
});


export const load: PageServerLoad = async () => {
    const categoryCreateForm = await superValidate(zod4(CategoryCreateSchema));
    return { categoryCreateForm };
};


export const actions = {

    create: async ({ request }) => {
        const categoryCreateForm = await superValidate(request, zod4(CategoryCreateSchema));

        if (!categoryCreateForm.valid) {
            return fail(400, { categoryCreateForm });
        }
        const name = categoryCreateForm.data.name.trim();
        const handle = name
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        const category = await client['product-categories'].post({ value: name  });
        if (!category) {
            return fail(400, { error: 'Failed to create category' });
        }

        return message(categoryCreateForm, 'Category created successfully');
        
    }
   
} satisfies Actions;