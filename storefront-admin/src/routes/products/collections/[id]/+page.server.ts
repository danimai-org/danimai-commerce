import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const CollectionUpdateSchema = z.object({
	id: z.string(),
	title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	handle: z
		.string()
		.max(100, 'Handle is too long')
		.regex(/^[a-z0-9-]*$/, 'Use lowercase letters, numbers, and hyphens only')
		.optional()
});

export const load: PageServerLoad = async () => {
	const collectionUpdateForm = await superValidate(
		{ id: '', title: '', handle: '' },
		zod4(CollectionUpdateSchema)
	);
	return { collectionUpdateForm };
};

export const actions = {
	update: async ({ request }) => {
		const collectionUpdateForm = await superValidate(request, zod4(CollectionUpdateSchema));
		if (!collectionUpdateForm.valid) {
			return fail(400, { collectionUpdateForm });
		}
		const title = collectionUpdateForm.data.title.trim();
		const rawHandle = (collectionUpdateForm.data.handle ?? '').trim();
		const handle = (rawHandle || title)
			.toLowerCase()
			.replace(/\s+/g, '-')
			.replace(/[^a-z0-9-]/g, '');
		const res = await client['collections']({ id: collectionUpdateForm.data.id }).put({
			title,
			handle
		});
		if (res.error) {
			return fail(400, {
				collectionUpdateForm,
				error:
					(res.error as { value?: { message?: string } } | undefined)?.value?.message ??
					'Failed to update collection'
			});
		}
		return message(collectionUpdateForm, 'Collection updated successfully');
	}
} satisfies Actions;