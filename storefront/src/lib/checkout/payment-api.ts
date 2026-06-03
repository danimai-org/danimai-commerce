import { browser } from '$app/environment';
import { client } from '$lib/api/client';
import { rowsFromPaginated } from '$lib/api/storefront-api';
import {
	CustomerAuthError,
	customerAuthHeaders,
	refreshCustomerAccessToken,
	treatyErrorMessage
} from '$lib/account/storage';

export type PaymentProviderOption = { id: string; name: string };

const PENDING_STRIPE_TX_PREFIX = 'dm_sf_stripe_tx_';

export type PendingStripePayment = {
	transactionId: string;
	orderId: string;
};

export function providerDisplayLabel(name: string): string {
	if (name === 'stripe') return 'Stripe';
	return name.charAt(0).toUpperCase() + name.slice(1);
}

export function paymentMethodLabel(
	method: string,
	providers: PaymentProviderOption[]
): string {
	if (method === 'manual') return 'Manual Payment';
	const provider = providers.find((p) => p.id === method);
	return provider ? providerDisplayLabel(provider.name) : method;
}

export function isApiPaymentMethod(
	method: string,
	providers: PaymentProviderOption[]
): boolean {
	return method !== 'manual' && providers.some((p) => p.id === method);
}

export function findPaymentProvider(
	method: string,
	providers: PaymentProviderOption[]
): PaymentProviderOption | undefined {
	return providers.find((p) => p.id === method);
}

export function savePendingStripePayment(orderId: string, transactionId: string): void {
	if (!browser) return;
	const payload: PendingStripePayment = { orderId, transactionId };
	sessionStorage.setItem(`${PENDING_STRIPE_TX_PREFIX}${orderId}`, JSON.stringify(payload));
}

export function loadPendingStripePayment(orderId: string): PendingStripePayment | null {
	if (!browser || !orderId) return null;
	try {
		const raw = sessionStorage.getItem(`${PENDING_STRIPE_TX_PREFIX}${orderId}`);
		if (!raw) return null;
		const parsed = JSON.parse(raw) as PendingStripePayment;
		if (!parsed.transactionId || !parsed.orderId) return null;
		return parsed;
	} catch {
		return null;
	}
}

export function clearPendingStripePayment(orderId: string): void {
	if (!browser || !orderId) return;
	sessionStorage.removeItem(`${PENDING_STRIPE_TX_PREFIX}${orderId}`);
}

export async function fetchActivePaymentProviders(): Promise<PaymentProviderOption[]> {
	const res = await client.storefront['payment-providers'].get({
		query: {
			page: 1,
			limit: 50,
			filters: { active: true }
		}
	});
	if (res.error || !res.data) return [];
	const { rows } = rowsFromPaginated<{ id: string; name: string }>(res.data);
	return rows.map((row) => ({ id: row.id, name: row.name }));
}

export async function resolvePaymentAuthHeaders(): Promise<Record<string, string>> {
	if (!browser) {
		throw new CustomerAuthError('Please log in to pay online.');
	}
	let headers = customerAuthHeaders();
	if (headers) return headers;

	const refreshed = await refreshCustomerAccessToken();
	headers = refreshed ? { Authorization: `Bearer ${refreshed}` } : null;
	if (!headers) {
		throw new CustomerAuthError('Please log in to pay online.');
	}
	return headers;
}

export async function ensureStripePaymentCustomer(
	providerId: string,
	details: { email: string; name: string },
	headers: Record<string, string>
): Promise<void> {
	const res = await client.storefront['payment-customers'].post(
		{
			provider_id: providerId,
			email: details.email.trim(),
			name: details.name.trim() || undefined
		},
		{ headers }
	);
	if (!res.error) return;

	const err = res.error as {
		value?: { message?: string; errors?: Array<{ type?: string }> };
	};
	const message = treatyErrorMessage(err);
	const alreadyExists =
		message.toLowerCase().includes('already exists') ||
		err.value?.errors?.some((e) => e.type === 'already_exists');
	if (alreadyExists) return;
	throw new Error(message);
}

export async function createOrderPayment(
	orderId: string,
	providerId: string,
	headers: Record<string, string>
): Promise<{ id: string }> {
	const res = await client.storefront.payments.post(
		{ order_id: orderId, provider_id: providerId },
		{ headers }
	);
	if (res.error) throw new Error(treatyErrorMessage(res.error));
	if (!res.data?.id) throw new Error('Failed to create payment');
	return { id: res.data.id };
}

export async function startStripeCheckout(
	paymentId: string,
	orderId: string
): Promise<{ checkoutUrl: string; transactionId: string }> {
	if (!browser) throw new Error('Checkout must run in the browser');

	const origin = window.location.origin;
	const res = await client.storefront['payment-transactions'].post({
		payment_id: paymentId,
		success_url: `${origin}/order/confirmation?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
		cancel_url: `${origin}/checkout?step=payment`
	});
	if (res.error) throw new Error(treatyErrorMessage(res.error));

	const data = res.data as { checkout_url?: string; id?: string } | undefined;
	if (!data?.checkout_url) throw new Error('Payment checkout URL was not returned');
	if (!data?.id) throw new Error('Payment transaction id was not returned');
	return { checkoutUrl: data.checkout_url, transactionId: data.id };
}

export async function confirmStripePayment(
	transactionId: string,
	sessionId: string
): Promise<void> {
	const res = await client.storefront['payment-transactions']({ id: transactionId }).put({
		session_id: sessionId
	});
	if (res.error) throw new Error(treatyErrorMessage(res.error));
}
