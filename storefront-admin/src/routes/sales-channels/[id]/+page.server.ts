import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const SalesChannelUpdateSchema = z.object({
    id: z.string().min(1, 'Sales channel id is required'),
    name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name is too long'),
    description: z.string().max(200, 'Description is too long').optional().default(''),
    is_default: z.boolean().default(false)
});



export const load: PageServerLoad = async ({ params }) => {
        const salesChannelUpdateForm = await superValidate(
            {
                id: params.id,
                name: '',
                description: '',
                is_default: false
            },
            zod4(SalesChannelUpdateSchema)
        );
    return { salesChannelUpdateForm };
};

export const actions = {

    update: async ({ request }) => {
        const salesChannelUpdateForm = await superValidate(request, zod4(SalesChannelUpdateSchema));    

        if (!salesChannelUpdateForm.valid) {
            return fail(400, { salesChannelUpdateForm });
        }
        const salesChannel = await client['sales-channels']({ id: salesChannelUpdateForm.data.id }).put({ name: salesChannelUpdateForm.data.name, description: salesChannelUpdateForm.data.description, is_default: salesChannelUpdateForm.data.is_default });
        if (!salesChannel) {
            return fail(400, { error: 'Failed to update sales channel' });
        }
        return message(salesChannelUpdateForm, 'Sales channel updated successfully');

    },
} satisfies Actions;