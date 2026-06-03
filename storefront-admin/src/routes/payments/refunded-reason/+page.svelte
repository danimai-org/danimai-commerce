<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import RefundReasonCreate from '$lib/components/organs/refund-reason/create/refundReasonCreate.svelte';
	import EditRefundReason from '$lib/components/organs/refund-reason/update/EditRefundReason.svelte';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	type RefundReason = {
		id: string;
		label: string;
		value: string;
		metadata?: unknown;
		created_at: string | Date;
		updated_at: string | Date;
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination<
		Awaited<ReturnType<typeof client['refund-reasons']['get']>>,
		RefundReason
	>(async () => {
		return client['refund-reasons'].get({ query: paginationQuery });
	}, ['refund-reasons']);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const rows = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const refetch = $derived(paginateState.refetch);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);

	const tableColumns: TableColumn[] = [
		{ label: 'Label', key: 'label', type: 'text' },
		{ label: 'Value', key: 'value', type: 'text' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => paginateState.openEdit(item as RefundReason)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => paginateState.openDeleteConfirm(item as RefundReason)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Refund Reasons | Danimai Store</title>
	<meta name="description" content="Manage refund reasons." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<MapPin class="size-4" />
				<span class="font-semibold">Refund Reasons</span>
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
						<TableBody {rows} columns={tableColumns} emptyMessage="No refund reasons yet." />
					</table>
				</div>
				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

{#if formMode === 'edit'}
	<EditRefundReason
		bind:open={paginateState.formSheetOpen}
		reason={formItem}
		onSuccess={() => refetch()}
	/>
{:else}
	<RefundReasonCreate bind:open={paginateState.formSheetOpen} onSuccess={() => refetch()} />
{/if}

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="refund reason"
	entityTitle={deleteItem?.label ?? deleteItem?.id ?? ''}
	onConfirm={() =>
		confirmDelete(async (item) => {
			const id = item.id;
			if (!id) throw new Error('Missing refund reason id');
			await client['refund-reasons'].delete({ refund_reason_ids: [id] });
		})}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
{#if deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{deleteError}
	</div>
{/if}
