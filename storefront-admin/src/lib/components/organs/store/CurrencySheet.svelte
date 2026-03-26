<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import EditCurrencySheet from './EditCurrencySheet.svelte';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { DropdownMenu } from 'bits-ui';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import type { Currency, CurrenciesListResponse } from '$lib/currencies/types.js';
	import AddCurrenciesSheet from '$lib/components/organs/store/add-currencies-sheet.svelte';
	import { createPagination } from '$lib/api/pagination.svelte.js';
	import { SvelteSet } from 'svelte/reactivity';

	type ApiErrorShape = { value?: { message?: string } };

	function getErrorMessage(err: unknown): string {
		if (err != null && typeof err === 'object' && 'value' in err) {
			const v = (err as ApiErrorShape).value?.message;
			if (typeof v === 'string') return v;
		}
		return String(err);
	}

	let pageNum = $state(1);
	let limit = $state(10);
	let search = $state('');

	const paginateState = createPagination(async () => {
		const res = await client.currencies.get({
			query: {
				page: pageNum,
				limit,
				...(search.trim() ? { search: search.trim() } : {})
			}
		});
		if (res.error) {
			throw new Error(getErrorMessage(res.error));
		}
		return res;
	}, ['currencies']);

	$effect(() => {
		void pageNum;
		void limit;
		void search;
		void paginateState.refetch();
	});

	const listPayload = $derived(
		(paginateState.query.data?.data ?? null) as CurrenciesListResponse | null
	);
	const pagination = $derived(listPayload?.pagination ?? null);
	const rows = $derived(listPayload?.rows ?? []);
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);

	const count = $derived(pagination?.total ?? 0);
	const totalPages = $derived(Math.max(1, pagination?.total_pages ?? 1));
	const start = $derived(
		pagination ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	let selectedIds = new SvelteSet<string>();
	const allVisibleSelected = $derived(
		rows.length > 0 && rows.every((r) => selectedIds.has(r.id))
	);

	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteItem = $state<Currency | null>(null);
	let deleteError = $state<string | null>(null);

	function toggleSelect(id: string) {
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
	}

	function toggleSelectAll() {
		if (allVisibleSelected) {
			for (const row of rows) selectedIds.delete(row.id);
			return;
		}
		for (const row of rows) selectedIds.add(row.id);
	}

	async function removeSelected() {
		if (selectedIds.size === 0) return;
		try {
			const res = await client.currencies.delete({ ids: Array.from(selectedIds) });
			if (res?.error) {
				void paginateState.refetch();
				return;
			}
			selectedIds.clear();
			void paginateState.refetch();
		} catch {
			void paginateState.refetch();
		}
	}

	function goToPage(nextPage: number) {
		pageNum = Math.min(totalPages, Math.max(1, nextPage));
	}

	function openDeleteConfirm(item: Currency) {
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

	async function confirmDelete() {
		if (!deleteItem) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			const res = await client.currencies.delete({ ids: [deleteItem.id] });
			if (res?.error) {
				throw new Error(getErrorMessage(res.error) || 'Failed to delete currency');
			}
			deleteConfirmOpen = false;
			deleteItem = null;
			void paginateState.refetch();
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}

	let addOpen = $state(false);
	function openAdd() {
		addOpen = true;
	}

	let editSheetOpen = $state(false);
	let editCurrency = $state<Currency | null>(null);

	function openEdit(item: Currency) {
		editCurrency = item;
		editSheetOpen = true;
	}
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b p-4">
		<h2 class="font-semibold">Currencies</h2>
		<div class="flex items-center gap-2">
			<Button size="sm" onclick={openAdd}>Add</Button>
			<Button size="sm" variant="outline">
				<SlidersHorizontal class="mr-2 size-4" />
				Sort
			</Button>
			<div class="relative">
				<Search
					class="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 text-muted-foreground"
				/>
				<Input
					class="h-9 w-56 pl-8"
					placeholder="Search"
					bind:value={search}
					oninput={() => (pageNum = 1)}
				/>
			</div>
			<Button size="icon" variant="outline" class="size-9">
				<SlidersHorizontal class="size-4" />
			</Button>
		</div>
	</div>

	{#if selectedIds.size > 0}
		<div class="flex items-center gap-2 border-b px-4 py-2">
			<Button
				variant="outline"
				size="sm"
				class="rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
				onclick={removeSelected}
			>
				<Trash2 class="mr-1.5 size-4" />
				Remove selected ({selectedIds.size})
			</Button>
		</div>
	{/if}

	<div class="overflow-auto p-4">
		<table class="w-full text-sm">
			<thead class="border-b bg-muted/20 text-left">
				<tr>
					<th class="w-10 px-4 py-3">
						<input
							type="checkbox"
							class="rounded border-muted-foreground/50"
							aria-label="Select all visible currencies"
							checked={allVisibleSelected}
							onchange={toggleSelectAll}
						/>
					</th>
					<th class="px-4 py-3 font-medium">Code</th>
					<th class="px-4 py-3 font-medium">Name</th>
					<th class="px-4 py-3 font-medium">Tax Inclusive Pricing</th>
					<th class="px-4 py-3 font-medium">Actions</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan={5} class="px-4 py-8 text-center text-muted-foreground">Loading…</td>
					</tr>
				{:else if error}
					<tr>
						<td colspan={5} class="px-4 py-8 text-center text-destructive">{error}</td>
					</tr>
				{:else if rows.length === 0}
					<tr>
						<td colspan={5} class="px-4 py-8 text-center text-muted-foreground"
							>No currencies found.</td
						>
					</tr>
				{:else}
					{#each rows as row (row.id)}
						<tr class="border-b last:border-b-0">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									class="rounded border-muted-foreground/50"
									aria-label={`Select ${row.code}`}
									checked={selectedIds.has(row.id)}
									onchange={() => toggleSelect(row.id)}
								/>
							</td>
							<td class="px-4 py-3 font-medium">{row.code}</td>
							<td class="px-4 py-3 text-muted-foreground">{row.name}</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.tax_inclusive_pricing ? 'Yes' : 'No'}
							</td>
							<td class="px-4 py-3">
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
									>
										<MoreHorizontal class="size-4" />
										<span class="sr-only">Actions</span>
									</DropdownMenu.Trigger>
									<DropdownMenu.Portal>
										<DropdownMenu.Content
											class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
											sideOffset={4}
										>
											<DropdownMenu.Item
												textValue="Edit"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
												onSelect={() => openEdit(row)}
											>
												<Pencil class="size-4" />
												Edit
											</DropdownMenu.Item>
											<DropdownMenu.Item
												textValue="Remove"
												class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive"
												onSelect={() => openDeleteConfirm(row)}
											>
												<Trash2 class="size-4" />
												Remove
											</DropdownMenu.Item>
										</DropdownMenu.Content>
									</DropdownMenu.Portal>
								</DropdownMenu.Root>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if count > 0}
		<div class="flex items-center justify-between gap-4 border-t px-4 py-3">
			<p class="text-sm text-muted-foreground">{start} - {end} of {count} results</p>
			<div class="flex items-center gap-2">
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(pageNum - 1)}
					disabled={pageNum <= 1}
				>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">{pageNum} of {totalPages}</span>
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(pageNum + 1)}
					disabled={pageNum >= totalPages}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
</div>

<EditCurrencySheet
	bind:open={editSheetOpen}
	currency={editCurrency}
	onSuccess={() => void paginateState.refetch()}
/>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="currency"
	entityTitle={deleteItem ? `${deleteItem.code} (${deleteItem.name})` : ''}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
	customMessage={deleteItem
		? `Are you sure you want to remove ${deleteItem.code} (${deleteItem.name})? This action cannot be undone.`
		: undefined}
/>

<AddCurrenciesSheet bind:open={addOpen} onSuccess={() => void paginateState.refetch()} />
