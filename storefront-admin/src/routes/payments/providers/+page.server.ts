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

const PaymentProviderCreateSchema = z.object({
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	active: z
		.union([z.boolean(), z.literal('on'), z.literal('true'), z.literal('false')])
		.optional()
		.transform((value) => value === true || value === 'on' || value === 'true'),
	metadata: metadataCreateField()
});

const PaymentProviderUpdateSchema = z.object({
	id: z.string().uuid('Payment provider id is required'),
	name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
	active: z
		.union([z.boolean(), z.literal('on'), z.literal('true'), z.literal('false')])
		.optional()
		.transform((value) => value === true || value === 'on' || value === 'true'),
	metadata: metadataUpdateField()
});

export const load: PageServerLoad = async () => {
	const paymentProviderCreateForm = await superValidate(
		{ name: '', active: true, metadata: '' },
		zod4(PaymentProviderCreateSchema)
	);

	const paymentProviderUpdateForm = await superValidate(
		{ id: '', name: '', active: true, metadata: '' },
		zod4(PaymentProviderUpdateSchema)
	);

	return { paymentProviderCreateForm, paymentProviderUpdateForm };
};

export const actions = {
	create: async ({ request }) => {
		const paymentProviderCreateForm = await superValidate(
			request,
			zod4(PaymentProviderCreateSchema)
		);

		if (!paymentProviderCreateForm.valid) {
			return fail(400, { paymentProviderCreateForm });
		}

		const { name, active, metadata } = paymentProviderCreateForm.data;
		const provider = await client['payment-providers'].post({
			name: name.trim(),
			...(active !== undefined ? { active } : {}),
			...(metadata !== undefined ? { metadata } : {})
		});

		if (!provider || (provider as { error?: unknown }).error) {
			return fail(400, {
				paymentProviderCreateForm,
				error: 'Failed to create payment provider'
			});
		}

		return message(paymentProviderCreateForm, 'Payment provider created successfully');
	},

	update: async ({ request }) => {
		const paymentProviderUpdateForm = await superValidate(
			request,
			zod4(PaymentProviderUpdateSchema)
		);

		if (!paymentProviderUpdateForm.valid) {
			return fail(400, { paymentProviderUpdateForm });
		}

		const { id, name, active, metadata } = paymentProviderUpdateForm.data;
		const provider = await client['payment-providers']({ id }).put({
			name: name.trim(),
			active,
			metadata
		});

		if (!provider || (provider as { error?: unknown }).error) {
			return fail(400, {
				paymentProviderUpdateForm,
				error: 'Failed to update payment provider'
			});
		}

		return message(paymentProviderUpdateForm, 'Payment provider updated successfully');
	}
} satisfies Actions;
