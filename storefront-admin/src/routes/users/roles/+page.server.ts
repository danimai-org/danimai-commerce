import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const RoleCreateSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters').max(50, 'Name is too long'),
	description: z.string().max(200, 'Description is too long').optional().default('')
});

const RoleUpdateSchema = RoleCreateSchema.extend({
	id: z.string().min(1, 'Role id is required')
});

export const load: PageServerLoad = async () => {
	const roleCreateForm = await superValidate(
		{
			name: '',
			description: ''
		},
		zod4(RoleCreateSchema)
	);

	const roleUpdateForm = await superValidate(
		{
			id: '',
			name: '',
			description: ''
		},
		zod4(RoleUpdateSchema)
	);

	return { roleCreateForm, roleUpdateForm };
};

export const actions = {
	create: async ({ request }) => {
		const roleCreateForm = await superValidate(request, zod4(RoleCreateSchema));

		if (!roleCreateForm.valid) {
			return fail(400, { roleCreateForm });
		}

		const role = await client['roles'].post(roleCreateForm.data);
		if (!role) {
			return fail(400, { error: 'Failed to create role' });
		}

		return message(roleCreateForm, 'Role created successfully');
	},
	update: async ({ request }) => {
		const roleUpdateForm = await superValidate(request, zod4(RoleUpdateSchema));

		if (!roleUpdateForm.valid) {
			return fail(400, { roleUpdateForm });
		}

		const role = await client['roles']({ id: roleUpdateForm.data.id }).put(roleUpdateForm.data);
		if (!role) {
			return fail(400, { error: 'Failed to update role' });
		}

		return message(roleUpdateForm, 'Role updated successfully');
	}
} satisfies Actions;