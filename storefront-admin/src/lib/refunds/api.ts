import { getApiBase, getValidAccessToken } from '$lib/auth.js';
import { parseMetadataFormValue, type PaymentProviderMetadata } from '$lib/payment-providers/metadata.js';

export type CreateRefundPayload = {
	payment_transaction_id: string;
	amount: string | number;
	refund_reason_id?: string;
	metadata?: PaymentProviderMetadata;
};

export async function createRefund(payload: CreateRefundPayload) {
	const token = await getValidAccessToken();
	if (!token) {
		throw new Error('You must be logged in to create a refund');
	}

	const body: Record<string, unknown> = {
		payment_transaction_id: payload.payment_transaction_id.trim(),
		amount: payload.amount
	};

	if (payload.refund_reason_id?.trim()) {
		body.refund_reason_id = payload.refund_reason_id.trim();
	}
	if (payload.metadata !== undefined) {
		body.metadata = payload.metadata;
	}

	const res = await fetch(`${getApiBase()}/refunds`, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		},
		body: JSON.stringify(body)
	});

	if (!res.ok) {
		const err = (await res.json().catch(() => null)) as { message?: string } | null;
		throw new Error(err?.message ?? 'Failed to create refund');
	}

	return res.json();
}

export function parseRefundMetadata(
	value: string | null | undefined,
	empty: 'omit'
): PaymentProviderMetadata | undefined;
export function parseRefundMetadata(
	value: string | null | undefined,
	empty: 'null'
): PaymentProviderMetadata | null;
export function parseRefundMetadata(
	value: string | null | undefined,
	empty: 'omit' | 'null'
): PaymentProviderMetadata | null | undefined {
	if (empty === 'null') {
		return parseMetadataFormValue(value, 'null');
	}
	return parseMetadataFormValue(value, 'omit');
}
