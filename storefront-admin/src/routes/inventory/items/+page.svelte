<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
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
	import { createInventoryItems, deleteInventoryItems } from '$lib/inventory-items/api.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';

	type InventoryItem = {
		id: string;
		sku: string | null;
		requires_shipping: boolean;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const paginateState = createPagination(
		async () => {
			return client.inventory.items.get({ query: paginationQuery });
		},
		['inventory-items']
	);

	$effect(() => {
		paginationQuery;
		paginateState.refetch();
	});

	const rows = $derived(
		(paginateState.query.data?.data?.rows ?? []) as unknown as InventoryItem[]
	);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const refetch = $derived(paginateState.refetch);
	const deleteItem = $derived(paginateState.deleteItem);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteError = $derived(paginateState.deleteError);

	let createSheetOpen = $state(false);
	let createSku = $state('');
	let createRequiresShipping = $state(true);
	let createSubmitting = $state(false);
	let createError = $state<string | null>(null);

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
			await createInventoryItems([
				{
					sku: createSku.trim() || null,
					requires_shipping: createRequiresShipping
				}
			]);
			closeCreateSheet();
			refetch();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
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
			cellHref: (row) => `/inventory/items/${String(row.id ?? '')}`,
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
					onClick: (item) => goto(`/inventory/items/${(item as InventoryItem).id}`)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as Parameters<typeof openDeleteConfirm>[0])
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
	bind:open={paginateState.deleteConfirmOpen}
	entityName="inventory item"
	entityTitle={(deleteItem as InventoryItem | null)?.sku ?? (deleteItem as InventoryItem | null)?.id ?? ''}
	onConfirm={() => confirmDelete((item: Record<string, unknown>) => deleteInventoryItems([(item as { id: string }).id]))}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
/>
