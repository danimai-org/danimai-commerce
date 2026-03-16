import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';


const TagUpdateSchema = z.object({
    value: z.string().min(3, "Value must be at least 3 characters").max(50, "Tag is too long"),
});


export const load: PageServerLoad = async () => {
    const tagUpdateForm = await superValidate(zod4(TagUpdateSchema));
    return { tagUpdateForm };
};

export const actions = {

    update: async ({ request, params }) => {
        const tagId = params.id;
        if (!tagId) {
            return fail(400, { error: 'Tag id is required' });
        }
        const tagUpdateForm = await superValidate(request, zod4(TagUpdateSchema));

        if (!tagUpdateForm.valid) {
            return fail(400, { tagUpdateForm });
        }
        const res = await client['product-tags']({ id: tagId }).put(tagUpdateForm.data);
        if (res.error) {
            return fail(400, { error: res.error });
        }
        return message(tagUpdateForm, 'Tag updated successfully');
    }
} satisfies Actions;