<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import ArrowLeftRight from '@lucide/svelte/icons/arrow-left-right';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const paginationQuery = $derived.by(() => {
		const query = createPaginationQuery(page.url.searchParams);
		const paymentId = page.url.searchParams.get('payment_id');
		if (!paymentId) return query;
		return {
			...query,
			filters: {
				...(typeof query.filters === 'object' && query.filters !== null ? query.filters : {}),
				payment_id: paymentId
			}
		};
	});

	const paginateState = createPagination(async () => {
		return client['payment-transactions'].get({ query: paginationQuery });
	}, ['payment-transactions']);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	type TransactionRow = {
		id: string;
		payment_id: string;
		customer_id: string;
		order_id?: string | null;
		order_display_id?: number | null;
		customer_email?: string | null;
		customer_first_name?: string | null;
		customer_last_name?: string | null;
		amount: string;
		currency_code: string;
		last_status: string;
		created_at: string | Date;
	};

	function formatAmount(value: string | number | null | undefined) {
		if (value === null || value === undefined || value === '') return '-';
		const amount = Number(value);
		if (Number.isNaN(amount)) return String(value);
		return amount.toFixed(2);
	}

	const rawRows = $derived((paginateState.query.data?.data?.rows ?? []) as TransactionRow[]);
	const rows = $derived(
		rawRows.map((r) => {
			const customerName = [r.customer_first_name, r.customer_last_name]
				.filter(Boolean)
				.join(' ')
				.trim();
			return {
				...r,
				amount: formatAmount(r.amount),
				order_label:
					r.order_display_id != null ? `#${r.order_display_id}` : r.payment_id.slice(0, 8),
				customer_label: r.customer_email || customerName || r.customer_id.slice(0, 8)
			};
		}) as Record<string, unknown>[]
	);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	const tableColumns: TableColumn[] = [
		{
			label: 'Order',
			key: 'order_label',
			type: 'link',
			cellHref: (row) => (row.order_id ? resolve(`/orders/${row.order_id}`, {}) : '#'),
			textKey: 'order_label'
		},
		{ label: 'Customer', key: 'customer_label', type: 'text' },
		{ label: 'Amount', key: 'amount', type: 'text' },
		{ label: 'Currency', key: 'currency_code', type: 'text' },
		{ label: 'Status', key: 'last_status', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{
			label: 'View Refund',
			key: 'view_refund',
			type: 'link',
			linkLabel: 'View Refund',
			cellHref: (row) => {
				const params = new URLSearchParams({
					payment_transaction_id: String(row.id)
				});
				return `/payments/refunds?${params.toString()}`;
			}
		}
	];
</script>

<svelte:head>
	<title>Payment Transactions | Danimai Store</title>
	<meta name="description" content="Manage payment transactions." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ArrowLeftRight class="size-4" />
				<span class="font-semibold">Payment Transaction</span>
			</div>
		</div>
		<PaginationTable>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody {rows} columns={tableColumns} emptyMessage="No payment transactions yet." />
					</table>
				</div>
				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>
