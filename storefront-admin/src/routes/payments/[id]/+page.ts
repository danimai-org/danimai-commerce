import type { PageLoad } from './$types';
import { client } from '$lib/client';

export const load: PageLoad = async ({ params, depends }) => {
	depends(`payment:${params.id}`);

	const [transactionsRes, refundsRes] = await Promise.all([
		client['payment-transactions'].get({
			query: { page: 1, limit: 50, filters: { payment_id: params.id } }
		}),
		client.refunds.get({
			query: { page: 1, limit: 50, filters: { payment_id: params.id } }
		})
	]);

	const transactions = transactionsRes.data?.rows ?? [];
	const refunds = refundsRes.data?.rows ?? [];
	const payment =
		transactions.length > 0
			? {
					id: params.id,
					amount: transactions[0].amount,
					currency_code: transactions[0].currency_code,
					last_status: transactions[0].last_status,
					provider_name: null
				}
			: {
					id: params.id,
					amount: null,
					currency_code: null,
					last_status: null,
					provider_name: null
				};

	const error =
		(transactionsRes.error as { value?: { message?: string } } | null)?.value?.message ??
		(refundsRes.error as { value?: { message?: string } } | null)?.value?.message ??
		null;

	return { payment, transactions, refunds, error };
};
