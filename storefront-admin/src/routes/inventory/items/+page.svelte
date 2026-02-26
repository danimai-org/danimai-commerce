<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import Search from '@lucide/svelte/icons/search';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Package from '@lucide/svelte/icons/package';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';

	const API_BASE = 'http://localhost:8000/admin';

	type InventoryItem = {
		id: string;
		sku: string | null;
		requires_shipping: boolean;	
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	let searchQuery = $state('');
	let page = $state(1);
	let limit = $state(10);
	let itemsData = $state<{ data: InventoryItem[]; pagination: Pagination } | null>(null);
	let itemsLoading = $state(true);
	let itemsError = $state<string | null>(null);

	async function fetchItems() {
		itemsLoading = true;
		itemsError = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'created_at',
				sorting_direction: 'desc'
			});
			if (searchQuery.trim()) {
				params.append('search', searchQuery.trim());
			}
			const res = await fetch(`${API_BASE}/inventory/items?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			itemsData = (await res.json()) as { data: InventoryItem[]; pagination: Pagination };
		} catch (e) {
			itemsError = e instanceof Error ? e.message : String(e);
			itemsData = null;
		} finally {
			itemsLoading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		searchQuery;
		fetchItems();
	});

	const items = $derived(itemsData?.data ?? []);
	const itemsPagination = $derived(itemsData?.pagination ?? null);
	const itemsStart = $derived(
		itemsPagination ? (itemsPagination.page - 1) * itemsPagination.limit + 1 : 0
	);
	const itemsEnd = $derived(
		itemsPagination ? Math.min(itemsPagination.page * itemsPagination.limit, itemsPagination.total) : 0
	);

	function formatDate(iso: string) {
		try {
			return new Date(iso).toLocaleDateString('en-US', {
				year: 'numeric',
				month: 'short',
				day: '2-digit'
			});
		} catch {
			return iso;
		}
	}

	function handleSearch() {
		page = 1;
		fetchItems();
	}

	// Create inventory item sheet
	let createSheetOpen = $state(false);
	let createSku = $state('');
	let createRequiresShipping = $state(true);
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreateSheet() {
		createSheetOpen = true;
		createSku = '';
		createRequiresShipping = true;
		createError = null;
	}

	function closeCreateSheet() {
		createSheetOpen = false;
	}

	async function submitCreate() {
		createError = null;
		createSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/inventory/items`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					inventory_items: [
						{
							sku: createSku.trim() || null,
							requires_shipping: createRequiresShipping
						}
					]
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeCreateSheet();
			fetchItems();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit inventory item sheet
	let editSheetOpen = $state(false);
	let editItemId = $state<string | null>(null);
	let editSku = $state('');
	let editRequiresShipping = $state(true);
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEditSheet(item: InventoryItem) {
		editItemId = item.id;
		editSku = item.sku ?? '';
		editRequiresShipping = item.requires_shipping;
		editError = null;
		editSheetOpen = true;
	}

	function closeEditSheet() {
		editSheetOpen = false;
		editItemId = null;
	}

	async function submitEdit() {
		if (!editItemId) return;
		editError = null;
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/inventory/items/${editItemId}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sku: editSku.trim() || null,
					requires_shipping: editRequiresShipping
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeEditSheet();
			fetchItems();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	// Delete inventory item
	let deleteModalOpen = $state(false);
	let deleteItemId = $state<string | null>(null);
	let deleteItemTitle = $state('');
	let deleteError = $state<string | null>(null);
	let deleteSubmitting = $state(false);

	function openDeleteModal(item: InventoryItem) {
		deleteItemId = item.id;
		deleteItemTitle = item.sku ?? item.id.slice(0, 8);
		deleteError = null;
		deleteModalOpen = true;
	}

	function closeDeleteModal() {
		if (!deleteSubmitting) {
			deleteModalOpen = false;
			deleteItemId = null;
			deleteError = null;
		}
	}

	async function confirmDelete() {
		if (!deleteItemId) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			const res = await fetch(`${API_BASE}/inventory/items/${deleteItemId}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const text = await res.text();
				let message = text;
				try {
					const json = JSON.parse(text) as { message?: string };
					if (json.message) message = json.message;
				} catch {
					// use text as-is
				}
				deleteError = message;
				return;
			}
			deleteModalOpen = false;
			deleteItemId = null;
			fetchItems();
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Package class="size-4" />
				<span class="font-semibold">Inventory Item</span>
			</div>
			<Button size="sm" onclick={openCreateSheet}>Create</Button>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex flex-wrap items-center justify-between gap-2">
				<Button variant="outline" size="sm" class="rounded-md">
					<SlidersHorizontal class="mr-1.5 size-4" />
					Add filter
				</Button>
				<div class="flex items-center gap-2">
					<div class="relative w-64">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
							onkeydown={(e) => {
								if (e.key === 'Enter') handleSearch();
							}}
						/>
					</div>
					<button
						type="button"
						class="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<ArrowUpDown class="size-4" />
						<span class="sr-only">Sort</span>
					</button>
				</div>
			</div>
		</div>

		{#if itemsError}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{itemsError}
			</div>
		{:else if itemsLoading}
			<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else}
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="px-4 py-3 text-left font-medium">SKU</th>
							<th class="px-4 py-3 text-left font-medium">Requires shipping</th>
							<th class="px-4 py-3 text-left font-medium">Created</th>
							<th class="px-4 py-3 text-left font-medium">Updated</th>
						</tr>
					</thead>
					<tbody>
						{#if items.length === 0}
							<tr>
								<td colspan="4" class="px-4 py-8 text-center text-muted-foreground">
									No inventory items found.
								</td>
							</tr>
						{:else}
							{#each items as item (item.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td
										class="px-4 py-3 font-medium cursor-pointer"
										onclick={() => goto(`/inventory/items/${item.id}`)}
									>
										{item.sku ?? '–'}
									</td>
									<td
										class="px-4 py-3 text-muted-foreground cursor-pointer"
										onclick={() => goto(`/inventory/items/${item.id}`)}
									>
										{item.requires_shipping ? 'Yes' : 'No'}
									</td>
									<td
										class="px-4 py-3 text-muted-foreground cursor-pointer"
										onclick={() => goto(`/inventory/items/${item.id}`)}
									>
										{formatDate(item.created_at)}
									</td>
									<td
										class="px-4 py-3 text-muted-foreground cursor-pointer"
										onclick={() => goto(`/inventory/items/${item.id}`)}
									>
										{formatDate(item.updated_at)}
									</td>
								</tr>
							{/each}
						{/if}
					</tbody>
				</table>
			</div>
			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if itemsPagination && itemsPagination.total > 0}
						{itemsStart} – {itemsEnd} of {itemsPagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!itemsPagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{itemsPagination?.page ?? 1} of {itemsPagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!itemsPagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create Inventory Item Sheet -->
<Sheet.Root bind:open={createSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Inventory Item</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new inventory item to track stock.
				</p>
				{#if createError && !createSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-sku" class="text-sm font-medium">SKU</label>
						<Input
							id="create-sku"
							bind:value={createSku}
							placeholder="e.g. SKU-001"
							class="h-9"
						/>
						<p class="text-xs text-muted-foreground">Optional. Leave blank for non-shippable items.</p>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="create-requires-shipping"
							bind:checked={createRequiresShipping}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="create-requires-shipping" class="text-sm font-medium">Requires shipping</label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreateSheet} disabled={createSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Inventory Item Sheet -->
<Sheet.Root bind:open={editSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Inventory Item</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update inventory item details.
				</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-sku" class="text-sm font-medium">SKU</label>
						<Input
							id="edit-sku"
							bind:value={editSku}
							placeholder="e.g. SKU-001"
							class="h-9"
						/>
						<p class="text-xs text-muted-foreground">Optional. Leave blank for non-shippable items.</p>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-requires-shipping"
							bind:checked={editRequiresShipping}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="edit-requires-shipping" class="text-sm font-medium">Requires shipping</label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditSheet} disabled={editSubmitting}>
					Cancel
				</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="inventory item"
	entityTitle={deleteItemTitle}
	onConfirm={confirmDelete}
	onCancel={closeDeleteModal}
	submitting={deleteSubmitting}
	error={deleteError}
/>
