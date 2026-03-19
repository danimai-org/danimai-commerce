<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { DropdownMenu } from 'bits-ui';
	import {
		DeleteConfirmationModal,
		AddCurrenciesSheet
	} from '$lib/components/organs/index.js';
	import {
		listCurrencies as listCurrenciesApi,
		updateCurrency,
		deleteCurrencies as deleteCurrenciesApi
	} from '$lib/currencies/api.js';
	import type { Currency, CurrenciesListResponse, Pagination } from '$lib/currencies/types.js';

	let rows = $state<Currency[]>([]);
	let pagination = $state<Pagination | null>(null);
	let pageNum = $state(1);
	let limit = $state(10);
	let search = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	const count = $derived(pagination?.total ?? 0);
	const totalPages = $derived(Math.max(1, pagination?.total_pages ?? 1));
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, count) : 0);
	const allVisibleSelected = $derived(rows.length > 0 && rows.every((r) => selectedIds.has(r.id)));

	let selectedIds = $state<Set<string>>(new Set());

	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteItem = $state<Currency | null>(null);
	let deleteError = $state<string | null>(null);

	$effect(() => {
		pageNum;
		limit;
		search;
		void loadCurrencies();
	});

	async function loadCurrencies() {
		loading = true;
		error = null;
		try {
			const res = await listCurrenciesApi({
				page: pageNum,
				limit,
				search: search.trim() || undefined
			});
			rows = res.rows ?? [];
			pagination = res.pagination ?? null;
		} catch (e) {
			rows = [];
			pagination = null;
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function toggleSelect(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}

	function toggleSelectAll() {
		if (allVisibleSelected) {
			const next = new Set(selectedIds);
			for (const row of rows) next.delete(row.id);
			selectedIds = next;
			return;
		}
		const next = new Set(selectedIds);
		for (const row of rows) next.add(row.id);
		selectedIds = next;
	}

	async function removeSelected() {
		if (selectedIds.size === 0) return;
		try {
			await deleteCurrenciesApi([...selectedIds]);
			selectedIds = new Set();
			void loadCurrencies();
		} catch {
			void loadCurrencies();
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
			await deleteCurrenciesApi([deleteItem.id]);
			deleteConfirmOpen = false;
			deleteItem = null;
			void loadCurrencies();
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
	let taxInclusivePricing = $state(false);
	let editError = $state<string | null>(null);
	let submitting = $state(false);

	function openEdit(item: Currency) {
		editCurrency = item;
		editError = null;
		taxInclusivePricing = item.tax_inclusive_pricing;
		editSheetOpen = true;
	}

	function closeEditSheet() {
		if (!submitting) editSheetOpen = false;
	}

	async function submitEdit() {
		if (!editCurrency) return;
		editError = null;
		submitting = true;
		try {
			await updateCurrency(editCurrency.id, { tax_inclusive_pricing: taxInclusivePricing });
			editSheetOpen = false;
			void loadCurrencies();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
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
					class="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
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
				<Button size="sm" variant="outline" onclick={() => goToPage(pageNum - 1)} disabled={pageNum <= 1}>
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

<Sheet.Root bind:open={editSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit currency</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update tax inclusive pricing for {editCurrency?.code ?? ''}.
				</p>
				{#if editError && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="currency-tax-inclusive"
							bind:checked={taxInclusivePricing}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="currency-tax-inclusive" class="text-sm font-medium"
							>Tax inclusive pricing</label
						>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditSheet}>Cancel</Button>
				<Button onclick={submitEdit} disabled={submitting}>
					{submitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

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

<AddCurrenciesSheet bind:open={addOpen} onSuccess={() => void loadCurrencies()} />
