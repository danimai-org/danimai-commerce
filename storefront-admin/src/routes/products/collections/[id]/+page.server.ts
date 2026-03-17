
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';


const CollectionUpdateSchema = z.object({
    id: z.string(),
    title: z.string().min(3, "Title must be at least 3 characters").max(50, "Title is too long"),
    handle: z.string().min(3, "Handle must be at least 3 characters").max(50, "Handle is too long"),
});


export const load: PageServerLoad = async () => {
    const collectionUpdateForm = await superValidate(zod4(CollectionUpdateSchema));
    return { collectionUpdateForm };
};


export const actions = {

   
    update: async ({ request }) => {
        const collectionUpdateForm = await superValidate(request, zod4(CollectionUpdateSchema));
        if (!collectionUpdateForm.valid) {
            return fail(400, { collectionUpdateForm });
        }
        const res = await client['collections']({ id: collectionUpdateForm.data.id }).put({ title: collectionUpdateForm.data.title, handle: collectionUpdateForm.data.handle });
        if (res.error) {
            return fail(400, { error: 'Failed to update collection' });
        }
        return message(collectionUpdateForm, 'Collection updated successfully');
    },
} satisfies Actions;