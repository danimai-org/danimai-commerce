<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CreateInventoryItemSheet,
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Package from '@lucide/svelte/icons/package';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { createPagination, createPaginationQuery } from '$lib/api';
	import { toast } from 'svelte-sonner';
	import { formatDate } from '$lib/utils';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => client.inventory.items.get({ query: paginationQuery }),
		['inventory-items'],
		paginationQuery
	);

	const { query } = paginateState;

	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);
	const rows = $derived(query.data?.data?.rows ?? []);
	type InventoryItemRow = (typeof rows)[number];

	const pagination = $derived(query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const deleteItem = $derived(paginateState.deleteItem);

	let createSheetOpen = $state(false);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	function openCreateSheet() {
		createSheetOpen = true;
	}

	const rowsForTable = $derived(
		rows.map((item) => ({
			...item,
			created_at_display: formatDate(item.created_at),
			updated_at_display: formatDate(item.updated_at),
			requires_shipping_display: item.requires_shipping ? 'Yes' : 'No'
		}))
	);
	const tableColumns: TableColumn<InventoryItemRow>[] = [
		{
			label: 'SKU',
			key: 'sku',
			type: 'link',
			cellHref: (row) => resolve(`/inventoryitems/${String(row.id ?? '')}`, {}),
			textKey: 'sku'
		},
		{ label: 'Requires shipping', key: 'requires_shipping_display', type: 'text' },
		{ label: 'Created', key: 'created_at_display', type: 'text' },
		{ label: 'Updated', key: 'updated_at_display', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => goto(resolve(`/inventoryitems/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						(openDeleteConfirm as unknown as (row: InventoryItemRow) => void)(
							item as InventoryItemRow
						)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Items | Inventory | Danimai Store</title>
	<meta name="description" content="Manage inventory items." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Package class="size-4" />
				<span class="font-semibold">Inventory items</span>
			</div>
			<Button size="sm" onclick={openCreateSheet}>Create</Button>
		</div>
		<PaginationTable>
			{#if error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{error}
				</div>
			{:else if loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rowsForTable}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No inventory items found."
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<CreateInventoryItemSheet
	bind:open={createSheetOpen}
	onSuccess={() => {
		void query.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="inventory item"
	entityTitle={(deleteItem as InventoryItemRow | null)?.sku ??
		(deleteItem as InventoryItemRow | null)?.id ??
		''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as InventoryItemRow;
			await client.inventory.items.delete({ ids: [row.id] });
			toast.success('Inventory item deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
