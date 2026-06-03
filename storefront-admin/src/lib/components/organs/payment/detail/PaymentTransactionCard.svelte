<script lang="ts">
	import {
		PaginationTable,
		TableHead,
		TableBody,
		type TableColumn
	} from '$lib/components/organs/index.js';

	type PaymentSummary = {
		id?: string | null;
		amount?: string | number | null;
		currency_code?: string | null;
		last_status?: string | null;
		provider_name?: string | null;
	};

	type PaymentTransaction = {
		id: string;
		amount?: string | number | null;
		currency_code?: string | null;
		last_status?: string | null;
		created_at?: string | Date | null;
	};

	let {
		payment = null,
		transactions = []
	}: { payment?: PaymentSummary | null; transactions: PaymentTransaction[] } = $props();

	function formatAmount(value: string | number | null | undefined) {
		if (value === null || value === undefined || value === '') return '-';
		const amount = Number(value);
		if (Number.isNaN(amount)) return String(value);
		return amount.toFixed(2);
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Transaction ID', key: 'id', type: 'text' },
		{ label: 'Status', key: 'last_status', type: 'statusBadge' },
		{ label: 'Amount', key: 'amount_display', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' }
	];

	const tableRows = $derived(
		transactions.map((transaction) => ({
			...transaction,
			amount_display:
				`${formatAmount(transaction.amount)} ${transaction.currency_code ?? ''}`.trim()
		})) as Record<string, unknown>[]
	);
</script>

<div class="min-w-0 rounded-lg border bg-card shadow-sm">
	<div class="border-b px-4 py-4 sm:px-6">
		<h2 class="text-base font-semibold">Payment Transactions</h2>
		{#if payment?.id}
			<p class="mt-1 text-xs text-muted-foreground">Payment ID: {payment.id}</p>
		{/if}
	</div>
	<PaginationTable showToolbar={false}>
		<div class="min-h-0 min-w-0 overflow-x-auto">
			<table class="min-w-full text-sm">
				<TableHead columns={tableColumns} />
				<TableBody
					rows={tableRows}
					columns={tableColumns}
					emptyMessage="No transactions found for this payment."
				/>
			</table>
		</div>
	</PaginationTable>
</div>
