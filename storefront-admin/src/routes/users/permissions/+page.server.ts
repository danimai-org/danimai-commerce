import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const PermissionCreateSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name is too long'),
	description: z.string().max(200, 'Description is too long').optional().default('')
});

const PermissionUpdateSchema = PermissionCreateSchema.extend({
	id: z.string().min(1, 'Permission id is required')
});

export const load: PageServerLoad = async () => {
	const permissionUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			description: ''
		},
		zod4(PermissionUpdateSchema)
	);
	return { permissionUpdateForm };
};

export const actions = {
	update: async ({ request }) => {
		const permissionUpdateForm = await superValidate(request, zod4(PermissionUpdateSchema));
		if (!permissionUpdateForm.valid) {
			return fail(400, { permissionUpdateForm });
		}
		const permission = await client['permissions']({ id: permissionUpdateForm.data.id }).put(permissionUpdateForm.data);
		if (!permission) {
			return fail(400, { error: 'Failed to update permission' });
		}
		return message(permissionUpdateForm, 'Permission updated successfully');
	}
} satisfies Actions;