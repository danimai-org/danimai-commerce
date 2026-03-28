import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client.js';

const TagCreateSchema = z.object({
	value: z.string().min(3, 'Value must be at least 3 characters').max(50, 'Tag is too long')
});

export const load: PageServerLoad = async () => {
	const tagCreateForm = await superValidate({ value: '' }, zod4(TagCreateSchema));
	return { tagCreateForm };
};

export const actions = {
	create: async ({ request }) => {
		const tagCreateForm = await superValidate(request, zod4(TagCreateSchema));

		if (!tagCreateForm.valid) {
			return fail(400, { tagCreateForm });
		}
		const res = await client['product-tags'].post(tagCreateForm.data);
		if (res.error) {
			return fail(400, {
				tagCreateForm,
				error: res.error.value?.message ?? 'Failed to create tag'
			});
		}
		return message(tagCreateForm, 'Tag created successfully');
	}
} satisfies Actions;
