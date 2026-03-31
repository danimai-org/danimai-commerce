import type { Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const UserUpdateSchema = z.object({
	id: z.string().min(1, 'User id is required'),
	first_name: z.string(),
	last_name: z.string(),
	role_ids: z.array(z.string()).default([])
});

export const actions = {
	updateUser: async ({ request }) => {
		const userUpdateForm = await superValidate(request, zod4(UserUpdateSchema));
		if (!userUpdateForm.valid) {
			return fail(400, { userUpdateForm });
		}
		const { id, first_name, last_name, role_ids } = userUpdateForm.data;
		const body = {
			first_name: first_name.trim() || null,
			last_name: last_name.trim() || null,
			role_id: role_ids[0] ?? null
		};
		const res = await client.users({ id }).put(body);
		if ((res as { error?: { value?: { message?: string } } }).error) {
			return fail(400, {
				userUpdateForm,
				error:
					(res as { error?: { value?: { message?: string } } }).error?.value?.message ??
					'Failed to update user'
			});
		}
		return message(userUpdateForm, 'User updated successfully');
	}
} satisfies Actions;
