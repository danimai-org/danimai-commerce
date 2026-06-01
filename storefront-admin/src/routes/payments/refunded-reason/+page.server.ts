import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { zod4 } from 'sveltekit-superforms/adapters';
import { superValidate, message } from 'sveltekit-superforms';
import { client } from '$lib/client';
import { parseMetadataFormValue } from '$lib/payment-providers/metadata.js';
import type { Actions, PageServerLoad } from './$types';

function metadataCreateField() {
	return z
		.string()
		.optional()
		.default('')
		.transform((value, ctx) => {
			try {
				return parseMetadataFormValue(value, 'omit');
			} catch (err) {
				ctx.addIssue({
					code: 'custom',
					message: err instanceof Error ? err.message : 'Invalid metadata'
				});
				return z.NEVER;
			}
		});
}

function metadataUpdateField() {
	return z
		.string()
		.optional()
		.default('')
		.transform((value, ctx) => {
			try {
				return parseMetadataFormValue(value, 'null');
			} catch (err) {
				ctx.addIssue({
					code: 'custom',
					message: err instanceof Error ? err.message : 'Invalid metadata'
				});
				return z.NEVER;
			}
		});
}

const RefundReasonCreateSchema = z.object({
	label: z.string().min(1, 'Label is required').max(200, 'Label is too long'),
	value: z.string().min(1, 'Value is required').max(100, 'Value is too long'),
	metadata: metadataCreateField()
});

const RefundReasonUpdateSchema = z.object({
	id: z.string().uuid('Refund reason id is required'),
	label: z.string().min(1, 'Label is required').max(200, 'Label is too long'),
	value: z.string().min(1, 'Value is required').max(100, 'Value is too long'),
	metadata: metadataUpdateField()
});

export const load: PageServerLoad = async () => {
	const refundReasonCreateForm = await superValidate(
		{ label: '', value: '', metadata: '' },
		zod4(RefundReasonCreateSchema)
	);

	const refundReasonUpdateForm = await superValidate(
		{ id: '', label: '', value: '', metadata: '' },
		zod4(RefundReasonUpdateSchema)
	);

	return { refundReasonCreateForm, refundReasonUpdateForm };
};

export const actions = {
	create: async ({ request }) => {
		const refundReasonCreateForm = await superValidate(
			request,
			zod4(RefundReasonCreateSchema)
		);

		if (!refundReasonCreateForm.valid) {
			return fail(400, { refundReasonCreateForm });
		}

		const { label, value, metadata } = refundReasonCreateForm.data;
		const reason = await client['refund-reasons'].post({
			label: label.trim(),
			value: value.trim(),
			...(metadata !== undefined ? { metadata } : {})
		});

		if (!reason || (reason as { error?: unknown }).error) {
			return fail(400, {
				refundReasonCreateForm,
				error: 'Failed to create refund reason'
			});
		}

		return message(refundReasonCreateForm, 'Refund reason created successfully');
	},

	update: async ({ request }) => {
		const refundReasonUpdateForm = await superValidate(
			request,
			zod4(RefundReasonUpdateSchema)
		);

		if (!refundReasonUpdateForm.valid) {
			return fail(400, { refundReasonUpdateForm });
		}

		const { id, label, value, metadata } = refundReasonUpdateForm.data;
		const reason = await client['refund-reasons']({ id }).put({
			label: label.trim(),
			value: value.trim(),
			metadata
		});

		if (!reason || (reason as { error?: unknown }).error) {
			return fail(400, {
				refundReasonUpdateForm,
				error: 'Failed to update refund reason'
			});
		}

		return message(refundReasonUpdateForm, 'Refund reason updated successfully');
	}
} satisfies Actions;
