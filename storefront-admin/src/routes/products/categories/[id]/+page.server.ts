import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const CategoryUpdateSchema = z.object({
	id: z.string(),
	title: z.string().min(3, 'Title must be at least 3 characters').max(50, 'Title is too long'),
	handle: z.string().min(3, 'Handle must be at least 3 characters').max(50, 'Handle is too long'),
	description: z.string().max(2000, 'Description is too long').optional().default(''),
	visibility: z.enum(['public', 'private'])
});

function parseMetadataRecord(raw: unknown): Record<string, string | number> {
	if (raw == null) return {};
	if (typeof raw === 'string') {
		try {
			const parsed = JSON.parse(raw) as unknown;
			if (parsed != null && typeof parsed === 'object' && !Array.isArray(parsed)) {
				return parsed as Record<string, string | number>;
			}
		} catch {
			return {};
		}
		return {};
	}
	if (typeof raw === 'object' && !Array.isArray(raw)) {
		return raw as Record<string, string | number>;
	}
	return {};
}

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

		const { id, title, handle, description, visibility } = categoryUpdateForm.data;

		const existing = await client['product-categories']({ id }).get();
		if (existing.error) {
			const err = existing.error as { value?: { message?: string } };
			return fail(400, {
				categoryUpdateForm,
				error: err.value?.message ?? 'Failed to load category'
			});
		}

		const metadata = {
			...parseMetadataRecord(existing.data?.metadata),
			description: description.trim()
		};

		const res = await client['product-categories']({ id }).put({
			value: title.trim(),
			handle: handle.trim(),
			visibility,
			metadata
		});

		if (res.error) {
			const err = res.error as { value?: { message?: string } };
			return fail(400, {
				categoryUpdateForm,
				error: err.value?.message ?? 'Failed to update category'
			});
		}

		return message(categoryUpdateForm, 'Category updated successfully');
	}
} satisfies Actions;
