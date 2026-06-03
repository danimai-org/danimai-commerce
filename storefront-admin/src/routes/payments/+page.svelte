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
	import Wallet from '@lucide/svelte/icons/wallet';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(async () => {
		return client.payments.get({ query: paginationQuery });
	}, ['payments']);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	type PaymentRow = {
		id: string;
		order_id: string;
		customer_id: string;
		order_display_id?: number | null;
		customer_email?: string | null;
		customer_first_name?: string | null;
		customer_last_name?: string | null;
		amount: string;
		currency_code: string;
		last_status: string;
		provider_name?: string | null;
		created_at: string | Date;
	};

function formatAmount(value: string | number | null | undefined) {
	if (value === null || value === undefined || value === '') return '-';
	const amount = Number(value);
	if (Number.isNaN(amount)) return String(value);
	return amount.toFixed(2);
}

	const rawRows = $derived((paginateState.query.data?.data?.rows ?? []) as PaymentRow[]);
	const rows = $derived(
		rawRows.map((r) => {
			const customerName = [r.customer_first_name, r.customer_last_name]
				.filter(Boolean)
				.join(' ')
				.trim();
			return {
				...r,
				amount: formatAmount(r.amount),
				payment_label: r.id.slice(0, 8),
				order_label: r.order_display_id != null ? `#${r.order_display_id}` : r.order_id.slice(0, 8),
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
			cellHref: (row) => resolve(`/orders/${row.order_id}`, {}),
			textKey: 'order_label'
		},
		{
			label: 'Payment',
			key: 'payment_label',
			type: 'link',
			cellHref: (row) => resolve(`/payments/${row.id}`, {}),
			textKey: 'payment_label'
		},
		{ label: 'Customer', key: 'customer_label', type: 'text' },
		{ label: 'Amount', key: 'amount', type: 'text' },
		{ label: 'Currency', key: 'currency_code', type: 'text' },
		{ label: 'Payment provider', key: 'provider_name', type: 'text' },
		{ label: 'Status', key: 'last_status', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' }
	];
</script>

<svelte:head>
	<title>Payments | Danimai Store</title>
	<meta name="description" content="Manage payments." />
</svelte:head>

<div class="flex h-full min-w-0 flex-col overflow-x-hidden">
	<div class="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-6">
		<div class="mb-4 flex min-w-0 items-center justify-between border-b pb-4 pl-0 sm:pl-10">
			<div class="flex items-center gap-2">
				<Wallet class="size-4" />
				<span class="font-semibold">Payment</span>
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
				<div class="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto rounded-lg border bg-card">
					<table class="min-w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody {rows} columns={tableColumns} emptyMessage="No payments yet." />
					</table>
				</div>
				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>
