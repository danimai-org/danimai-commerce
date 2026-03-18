<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { createQuery } from '@tanstack/svelte-query';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Package from '@lucide/svelte/icons/package';
	import { client } from '$lib/client.js';

	type InventoryItem = {
		id: string;
		sku: string | null;
		requires_shipping: boolean;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type PaginationMeta = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	const pageNum = $derived(Math.max(1, parseInt(page.url.searchParams.get('page') ?? '1', 10) || 1));
	const pageLimit = $derived(Math.max(1, Math.min(100, parseInt(page.url.searchParams.get('limit') ?? '10', 10) || 10)));

	const listQuery = createQuery(() => ({
		queryKey: ['inventory-items', String(pageNum), String(pageLimit)],
		queryFn: async (): Promise<{ data: { rows: InventoryItem[]; pagination: PaginationMeta } } | null> => {
			const res = await client.inventory.items.get({
				query: { page: pageNum, limit: pageLimit } as Record<string, string | number>
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to fetch inventory items'));
			}
			return (res.data ?? null) as unknown as { data: { rows: InventoryItem[]; pagination: PaginationMeta } } | null;
		}
	}));

	const loading = $derived(listQuery.isPending);
	const error = $derived(
		listQuery.error != null ? (listQuery.error instanceof Error ? listQuery.error.message : String(listQuery.error)) : null
	);
	const rows = $derived((listQuery.data?.data?.rows ?? []) as InventoryItem[]);
	const pagination = $derived((listQuery.data?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0);

	let createSheetOpen = $state(false);
	let createSku = $state('');
	let createRequiresShipping = $state(true);
	let createSubmitting = $state(false);
	let createError = $state<string | null>(null);
	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);
	let deleteItem = $state<InventoryItem | null>(null);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function openCreateSheet() {
		createSku = '';
		createRequiresShipping = true;
		createError = null;
		createSheetOpen = true;
	}

	function closeCreateSheet() {
		if (!createSubmitting) createSheetOpen = false;
	}

	async function submitCreate() {
		createError = null;
		createSubmitting = true;
		try {
			const res = await client.inventory.items.post({
				inventory_items: [{
					sku: createSku.trim() || null,
					requires_shipping: createRequiresShipping
				}]
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to create inventory item'));
			}
			closeCreateSheet();
			listQuery.refetch();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	function openDeleteConfirm(item: InventoryItem) {
		deleteItem = item;
		deleteError = null;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) {
			deleteConfirmOpen = false;
			deleteItem = null;
			deleteError = null;
		}
	}

	async function confirmDeleteItem() {
		if (!deleteItem?.id) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			const res = await client.inventory.items.delete({
				inventory_item_ids: [deleteItem.id]
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to delete inventory item'));
			}
			deleteConfirmOpen = false;
			deleteItem = null;
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
		(rows as InventoryItem[]).map((item) => ({
			...item,
			created_at_display: formatDate(item.created_at),
			updated_at_display: formatDate(item.updated_at),
			requires_shipping_display: item.requires_shipping ? 'Yes' : 'No'
		}))
	);

	const tableColumns: TableColumn[] = [
		{
			label: 'SKU',
			key: 'sku',
			type: 'link',
			cellHref: (row) => `/inventoryitems/${String(row.id ?? '')}`,
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
					onClick: (item) => goto(`/inventoryitems/${(item as InventoryItem).id}`)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as InventoryItem)
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

<Sheet.Root bind:open={createSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form
			class="flex h-full flex-col"
			onsubmit={(e) => {
				e.preventDefault();
				submitCreate();
			}}
		>
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create inventory item</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new inventory item by SKU and shipping options.
				</p>
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-sku" class="text-sm font-medium">SKU</label>
						<Input
							id="create-sku"
							type="text"
							placeholder="Optional"
							bind:value={createSku}
							class="w-full"
						/>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="create-requires-shipping"
							bind:checked={createRequiresShipping}
							class="size-4 rounded border-input"
						/>
						<label for="create-requires-shipping" class="text-sm font-medium">Requires shipping</label>
					</div>
					{#if createError}
						<div
							class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
						>
							{createError}
						</div>
					{/if}
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button type="button" variant="outline" onclick={closeCreateSheet} disabled={createSubmitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="inventory item"
	entityTitle={(deleteItem as InventoryItem | null)?.sku ?? (deleteItem as InventoryItem | null)?.id ?? ''}
	onConfirm={confirmDeleteItem}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
/>
