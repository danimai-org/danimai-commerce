import { client } from '$lib/client';
import type { DetailById } from '$lib/client';
import type { OrderDetailOrder } from './types.js';

export type OrderPaymentForRefund = {
	paymentId: string;
	paymentTransactionId: string;
	amount: string;
};

export type OrderLoadResult = {
	order: OrderDetailOrder | null;
	error: string | null;
};

export async function fetchOrder(id: string | undefined): Promise<OrderLoadResult> {
	if (!id) return { order: null, error: null };
	try {
		const res = await client.orders({ id }).get();
		if (res.error) {
			const err = res.error as { value?: { message?: string }; status?: number };
			return {
				order: null,
				error:
					err?.value?.message ?? (err?.status === 404 ? 'Order not found' : 'Failed to load order')
			};
		}
		return { order: res.data ?? null, error: null };
	} catch (e) {
		return { order: null, error: e instanceof Error ? e.message : String(e) };
	}
}

export type CustomerInfo = Pick<
	DetailById<typeof client.customers>,
	'phone' | 'first_name' | 'last_name'
> & {
	firstName: string | null;
	lastName: string | null;
};

export async function fetchOrderPaymentForRefund(
	orderId: string
): Promise<OrderPaymentForRefund | null> {
	const res = await client.payments.get({
		query: { page: 1, limit: 1, filters: { order_id: orderId } }
	});
	if (res.error || !res.data) return null;
	const payment = res.data.rows[0];
	if (!payment?.success_transaction_id) return null;
	return {
		paymentId: payment.id,
		paymentTransactionId: payment.success_transaction_id,
		amount: String(payment.amount)
	};
}

export async function fetchCustomerInfo(customerId: string | null | undefined): Promise<CustomerInfo> {
	if (!customerId) {
		return { phone: null, first_name: null, last_name: null, firstName: null, lastName: null };
	}
	const custRes = await client.customers({ id: customerId }).get();
	if (custRes.error || !custRes.data) {
		return { phone: null, first_name: null, last_name: null, firstName: null, lastName: null };
	}
	const first_name = custRes.data.first_name ?? null;
	const last_name = custRes.data.last_name ?? null;
	return {
		phone: custRes.data.phone ?? null,
		first_name,
		last_name,
		firstName: first_name,
		lastName: last_name
	};
}
