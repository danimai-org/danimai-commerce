import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const SalesChannelCreateSchema = z.object({
    name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name is too long'),
    description: z.string().max(200, 'Description is too long').optional().default(''),
    is_default: z.coerce.boolean().default(false)
});



export const load: PageServerLoad = async () => {
        const salesChannelCreateForm = await superValidate(
            {
                name: '',
                description: '',
                is_default: false
            },
            zod4(SalesChannelCreateSchema)
        );
    return { salesChannelCreateForm };
};

export const actions = {

    create: async ({ request }) => {
        const salesChannelCreateForm = await superValidate(request, zod4(SalesChannelCreateSchema));    

        if (!salesChannelCreateForm.valid) {
            return fail(400, { salesChannelCreateForm });
        }
        const salesChannel = await client['sales-channels'].post(salesChannelCreateForm.data);
        if (!salesChannel) {
            return fail(400, { error: 'Failed to create sales channel' });
        }
        return message(salesChannelCreateForm, 'Sales channel created successfully');

    },
} satisfies Actions;