<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import RefundCreate from '$lib/components/organs/refund/create/refundCreate.svelte';
	import EditRefund from '$lib/components/organs/refund/update/EditRefund.svelte';
	import DeleteConfirmationModal from '$lib/components/organs/modal/delete-confirmation-modal.svelte';
	import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { deleteRefunds } from '$lib/refunds/api.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type RefundStatus = 'pending' | 'failed' | 'succeeded' | 'cancelled';

	type Refund = {
		id: string;
		customer_id: string;
		customer_display?: string;
		payment_id: string;
		payment_transaction_id: string;
		amount: string;
		refund_reason_id: string | null;
		refund_reason_label: string | null;
		last_status: RefundStatus;
		metadata?: unknown;
		created_at: string | Date;
		updated_at: string | Date;
	};

	const paginationQuery = $derived.by(() => {
		const query = createPaginationQuery(page.url.searchParams);
		const paymentId = page.url.searchParams.get('payment_id');
		const paymentTransactionId = page.url.searchParams.get('payment_transaction_id');
		if (!paymentId && !paymentTransactionId) return query;
		return {
			...query,
			filters: {
				...(typeof query.filters === 'object' && query.filters !== null ? query.filters : {}),
				...(paymentId ? { payment_id: paymentId } : {}),
				...(paymentTransactionId ? { payment_transaction_id: paymentTransactionId } : {})
			}
		};
	});

	const paginateState = createPagination<
		Awaited<ReturnType<typeof client.refunds.get>>,
		Refund
	>(async () => {
		return client.refunds.get({ query: paginationQuery });
	}, ['refunds']);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	function formatAmount(value: string | number | null | undefined) {
		if (value === null || value === undefined || value === '') return '-';
		const amount = Number(value);
		if (Number.isNaN(amount)) return String(value);
		return amount.toFixed(2);
	}

	const rows = $derived(
		(paginateState.query.data?.data?.rows ?? []).map((r) => ({
			...r,
			amount: formatAmount(r.amount)
		}))
	);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const refetch = $derived(paginateState.refetch);
	let deleteTarget = $state<Refund | null>(null);
	let deleteLoading = $state(false);
	let deleteError = $state<string | null>(null);

	function openDeleteModal(item: Refund) {
		deleteTarget = item;
		deleteError = null;
	}

	function closeDeleteModal() {
		if (deleteLoading) return;
		deleteTarget = null;
		deleteError = null;
	}

	async function confirmDeleteRefund() {
		if (!deleteTarget) return;
		deleteLoading = true;
		deleteError = null;
		try {
			await deleteRefunds([deleteTarget.id]);
			await refetch();
			deleteTarget = null;
		} catch (error) {
			deleteError = error instanceof Error ? error.message : 'Failed to delete refund';
		} finally {
			deleteLoading = false;
		}
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Payment', key: 'payment_id', type: 'text' },
		{ label: 'Transaction', key: 'payment_transaction_id', type: 'text' },
		{ label: 'Customer', key: 'customer_display', type: 'text' },
		{ label: 'Amount', key: 'amount', type: 'text' },
		{ label: 'Refund Reason', key: 'refund_reason_label', type: 'text' },
		{ label: 'Status', key: 'last_status', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => paginateState.openEdit(item as Refund)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteModal(item as Refund)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Refunds | Danimai Store</title>
	<meta name="description" content="Manage refunds." />
</svelte:head>

<div class="flex h-full min-w-0 flex-col overflow-x-hidden">
	<div class="flex min-h-0 min-w-0 flex-1 flex-col p-4 sm:p-6">
		<div class="mb-4 flex min-w-0 items-center justify-between border-b pb-4 pl-0 sm:pl-10">
			<div class="flex items-center gap-2">
				<RotateCcw class="size-4" />
				<span class="font-semibold">Refunds</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
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
						<TableBody {rows} columns={tableColumns} emptyMessage="No refunds yet." />
					</table>
				</div>
				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

{#if formMode === 'edit'}
	<EditRefund
		bind:open={paginateState.formSheetOpen}
		refund={formItem}
		onSuccess={() => refetch()}
	/>
{:else}
	<RefundCreate bind:open={paginateState.formSheetOpen} onSuccess={() => refetch()} />
{/if}

{#if deleteTarget}
	<DeleteConfirmationModal
		open={true}
		entityName="refund"
		entityTitle={deleteTarget.id}
		onConfirm={confirmDeleteRefund}
		onCancel={closeDeleteModal}
		submitting={deleteLoading}
		error={deleteError}
	/>
{/if}
