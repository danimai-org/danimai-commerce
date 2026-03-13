
import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const CollectionCreateSchema = z.object({
    value: z.string().min(3, "Value must be at least 3 characters").max(50, "Tag is too long"),
});


export const load: PageServerLoad = async () => {
    const collectionCreateForm = await superValidate(zod4(CollectionCreateSchema));
    return { collectionCreateForm };
};


export const actions = {

    create: async ({ request }) => {
        const collectionCreateForm = await superValidate(request, zod4(CollectionCreateSchema));

        if (!collectionCreateForm.valid) {
            return fail(400, { collectionCreateForm });
        }
        const title = collectionCreateForm.data.value.trim();
        const handle = title
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9-]/g, '');
        const collection = await client['collections'].post({ title, handle });
        if (!collection) {
            return fail(400, { error: 'Failed to create collection' });
        }
        return message(collectionCreateForm, 'Collection created successfully');

    }
} satisfies Actions;