<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		PriceListFormSheet,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import type { QueryFunction } from '@tanstack/svelte-query';
	import { loadPriceLists, deletePriceList, type PriceList } from '$lib/price-lists/storage.js';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination<PriceList>(
		(async () => {
			const list = loadPriceLists();
			const pageNum = Number(paginationQuery?.page) || 1;
			const limitNum = Number(paginationQuery?.limit) || 10;
			const total = list.length;
			const totalPages = Math.max(1, Math.ceil(total / limitNum));
			const startIdx = (pageNum - 1) * limitNum;
			const rows = list.slice(startIdx, startIdx + limitNum);
			const pagination = {
				total,
				page: pageNum,
				limit: limitNum,
				total_pages: totalPages,
				has_next_page: pageNum < totalPages,
				has_previous_page: pageNum > 1
			};
			return { data: { rows, pagination } } as unknown as PriceList;
		}) as QueryFunction<PriceList>,
		['price-lists']
	);

	$effect(() => {
		page.url.searchParams.toString();
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	type QueryData = { data: { rows: PriceList[]; pagination: { total: number; page: number; limit: number; total_pages: number; has_next_page: boolean; has_previous_page: boolean } } };
	const queryData = $derived(paginateState.query.data as unknown as QueryData | undefined);
	const rows = $derived(queryData?.data?.rows ?? []) as Record<string, unknown>[];
	const pagination = $derived(queryData?.data?.pagination ?? null);
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const closeForm = $derived(paginateState.closeForm);
	const deleteConfirmOpen = $derived(paginateState.deleteConfirmOpen);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);

	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Type', key: 'type', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Starts', key: 'starts_at', type: 'date' },
		{ label: 'Ends', key: 'ends_at', type: 'date' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => openEdit(item as PriceList) },
				{ label: 'Delete', key: 'delete', type: 'button', onClick: (item) => openDeleteConfirm(item as PriceList) }
			]
		}
	];
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListChecks class="size-4" />
				<span class="font-semibold">Price Lists</span>
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
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No price lists yet. Create one to define custom pricing (e.g. sales or overrides)."
						/>
					</table>
				</div>

				<TablePagination
					{pagination}
					{start}
					{end}
					onPageChange={goToPage}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>

<PriceListFormSheet
	bind:open={paginateState.formSheetOpen}
	mode={formMode}
	list={formItem}
	onSuccess={refetch}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="price list"
	entityTitle={deleteItem?.name ?? deleteItem?.id ?? ''}
	onConfirm={() => confirmDelete((pl) => deletePriceList(pl))}
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

