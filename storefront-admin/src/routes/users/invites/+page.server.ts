import type { Actions, PageServerLoad } from './$types';
import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';

const INVITE_EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const InviteCreateSchema = z.object({
	email: z
		.string()
		.trim()
		.min(1, 'Invalid email address')
		.refine((s) => INVITE_EMAIL_PATTERN.test(s), 'Invalid email address'),
	role_ids: z.array(z.string()).default([])
});

export const load: PageServerLoad = async () => {
	const inviteCreateForm = await superValidate(
		{
			email: '',
			role_ids: []
		},
		zod4(InviteCreateSchema)
	);
	return { inviteCreateForm };
};

export const actions = {
	create: async ({ request }) => {
		const inviteCreateForm = await superValidate(request, zod4(InviteCreateSchema));

		if (!inviteCreateForm.valid) {
			return fail(400, { inviteCreateForm });
		}

		try {
			const invite = await client.invites.post(inviteCreateForm.data);
			if (invite.error) {
				return fail(400, {
					inviteCreateForm,
					error: invite.error.value?.message ?? 'Failed to create invite'
				});
			}
		} catch {
			return fail(500, { inviteCreateForm, error: 'Failed to create invite' });
		}

		return message(inviteCreateForm, 'Invite created successfully');
	}
} satisfies Actions;
