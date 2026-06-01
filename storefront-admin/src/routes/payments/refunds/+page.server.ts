import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import { parseRefundMetadata } from '$lib/refunds/api.js';
import type { Actions, PageServerLoad } from './$types';

function refundMetadataUpdateField() {
	return z
		.string()
		.optional()
		.default('')
		.transform((value, ctx) => {
			try {
				return parseRefundMetadata(value, 'null');
			} catch (err) {
				ctx.addIssue({
					code: 'custom',
					message: err instanceof Error ? err.message : 'Invalid metadata'
				});
				return z.NEVER;
			}
		});
}

const RefundUpdateSchema = z.object({
	id: z.string().uuid('Refund id is required'),
	last_status: z.enum(['pending', 'failed', 'succeeded', 'cancelled']).optional(),
	refund_reason_id: z
		.string()
		.optional()
		.default('')
		.transform((value) => {
			const trimmed = value.trim();
			return trimmed ? trimmed : null;
		}),
	metadata: refundMetadataUpdateField()
});

export const load: PageServerLoad = async () => {
	const refundUpdateForm = await superValidate(
		{
			id: '',
			last_status: 'pending',
			refund_reason_id: '',
			metadata: ''
		},
		zod4(RefundUpdateSchema)
	);

	return { refundUpdateForm };
};

export const actions = {
	update: async ({ request }) => {
		const refundUpdateForm = await superValidate(request, zod4(RefundUpdateSchema));

		if (!refundUpdateForm.valid) {
			return fail(400, { refundUpdateForm });
		}

		const { id, last_status, refund_reason_id, metadata } = refundUpdateForm.data;
		const refund = await client.refunds({ id }).put({
			...(last_status !== undefined ? { last_status } : {}),
			refund_reason_id,
			metadata
		});

		if (!refund || (refund as { error?: unknown }).error) {
			return fail(400, { refundUpdateForm, error: 'Failed to update refund' });
		}

		return message(refundUpdateForm, 'Refund updated successfully');
	}
} satisfies Actions;
