<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
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


	const pageNum = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1));
	const pageLimit = $derived(Math.max(1, Math.min(100, parseInt(page.url.searchParams.get('limit') ?? '10', 10) || 10)));

	const listQuery = createQuery(() => ({
		queryKey: ['inventory-items', String(pageNum), String(pageLimit)],
		queryFn: async () => {
			const res = await client.inventory.items.get({
				query: { page: pageNum, limit: pageLimit } as Record<string, string | number>
			});
			
			return res.data;
		}
	}));

	// isPending alone stays true when the query is disabled (e.g. SSR: global enabled: browser), which never clears.
	const loading = $derived(listQuery.isPending && listQuery.isFetching);
	const error = $derived(
		listQuery.error != null ? (listQuery.error instanceof Error ? listQuery.error.message : String(listQuery.error)) : null
	);
	const rows = $derived(listQuery.data?.rows ?? []);
	const pagination = $derived(listQuery.data?.pagination ?? null);
	const start = $derived(pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0);
	const deleteItem = $derived(rows.find((item) => item.id === deleteItemId) ?? null);

	let createSheetOpen = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);
	let deleteItemId = $state<string | null>(null);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`), { replaceState: true });
	}

	function openCreateSheet() {
		createSheetOpen = true;
	}

	function openDeleteConfirm(itemId: string) {
		deleteItemId = itemId;
		deleteError = null;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			deleteItemId = null;
			deleteError = null;
		}
	}

	async function confirmDeleteItem() {
		if (!deleteItemId) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			const res = await client.inventory.items.delete({
				ids: [deleteItemId]
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to delete inventory item'));
			}
			deleteConfirmOpen = false;
			deleteItemId = null;
			listQuery.refetch();
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-US', {
			year: 'numeric',
			month: 'short',
			day: '2-digit'
		});
	}

	const rowsForTable = $derived(
		rows.map((item) => ({
			...item,
			created_at_display: formatDate(item.created_at.toISOString()),
			updated_at_display: formatDate(item.updated_at.toISOString()),
			requires_shipping_display: item.requires_shipping ? 'Yes' : 'No'
		}))
	);

	const tableColumns: TableColumn[] = [
		{
			label: 'SKU',
			key: 'sku',
			type: 'link',
			cellHref: (row) => resolve(`/inventoryitems/${String(row.id ?? '')}`),
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
					onClick: (item) => goto(resolve(`/inventoryitems/${item.id}`))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item.id)
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
							columns={tableColumns}
							emptyMessage="No inventory items found."
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

<CreateInventoryItemSheet
	bind:open={createSheetOpen}
	onSuccess={() => {
		void listQuery.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="inventory item"
	entityTitle={(deleteItem as any | null)?.sku ?? (deleteItem as any | null)?.id ?? ''}
	onConfirm={confirmDeleteItem}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
/>
