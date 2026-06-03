<script lang="ts">
	import {
		PaginationTable,
		TableHead,
		TableBody,
		type TableColumn
	} from '$lib/components/organs/index.js';

	type RefundItem = {
		id: string;
		payment_transaction_id?: string | null;
		amount?: string | number | null;
		refund_reason_label?: string | null;
		last_status?: string | null;
		created_at?: string | Date | null;
	};

	let { refunds = [] }: { refunds: RefundItem[] } = $props();

	function formatAmount(value: string | number | null | undefined) {
		if (value === null || value === undefined || value === '') return '-';
		const amount = Number(value);
		if (Number.isNaN(amount)) return String(value);
		return amount.toFixed(2);
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Refund ID', key: 'id', type: 'text' },
		{ label: 'Status', key: 'last_status', type: 'statusBadge' },
		{ label: 'Amount', key: 'amount_display', type: 'text' },
		{ label: 'Reason', key: 'refund_reason_label', type: 'text' },
		{ label: 'Payment Transaction', key: 'payment_transaction_id', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' }
	];

	const tableRows = $derived(
		refunds.map((refund) => ({
			...refund,
			amount_display: formatAmount(refund.amount)
		})) as Record<string, unknown>[]
	);
</script>

<div class="min-w-0 rounded-lg border bg-card shadow-sm">
	<div class="border-b px-4 py-4 sm:px-6">
		<h2 class="text-base font-semibold">Refunds</h2>
	</div>
	<PaginationTable showToolbar={false}>
		<div class="min-h-0 min-w-0 overflow-x-auto">
			<table class="min-w-full text-sm">
				<TableHead columns={tableColumns} />
				<TableBody
					rows={tableRows}
					columns={tableColumns}
					emptyMessage="No refunds found for this payment."
				/>
			</table>
		</div>
	</PaginationTable>
</div>
