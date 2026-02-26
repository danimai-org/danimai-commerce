<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { cn } from '$lib/utils.js';

	const API_BASE = 'http://localhost:8000/admin';

	type Currency = {
		id: string;
		code: string;
		name: string;
		symbol: string;
		symbol_native: string;
		tax_inclusive_pricing: boolean;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type AvailableCurrency = {
		code: string;
		name: string;
		symbol: string;
		symbol_native: string;
		active: boolean;
		id?: string;
		tax_inclusive_pricing: boolean;
	};

	type Pagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	// Active currencies (main panel)
	let page = $state(1);
	let limit = $state(10);
	let data = $state<{ data: Currency[]; pagination: Pagination } | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let selectedIds = $state<Set<string>>(new Set());

	async function fetchCurrencies() {
		loading = true;
		error = null;
		try {
			const params = new URLSearchParams({
				page: String(page),
				limit: String(limit),
				sorting_field: 'code',
				sorting_direction: 'asc'
			});
			const res = await fetch(`${API_BASE}/currencies?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			data = (await res.json()) as { data: Currency[]; pagination: Pagination };
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		page;
		limit;
		fetchCurrencies();
	});

	const currencies = $derived(data?.data ?? []);
	const pagination = $derived(data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	function toggleSelect(id: string) {
		selectedIds = new Set(selectedIds);
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
	}

	function toggleSelectAll() {
		if (selectedIds.size === currencies.length) selectedIds = new Set();
		else selectedIds = new Set(currencies.map((c) => c.id));
	}

	async function removeCurrency(currency: Currency) {
		try {
			const res = await fetch(`${API_BASE}/currencies`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currency_ids: [currency.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			selectedIds = new Set(selectedIds);
			selectedIds.delete(currency.id);
			fetchCurrencies();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function removeSelected() {
		if (selectedIds.size === 0) return;
		try {
			const res = await fetch(`${API_BASE}/currencies`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currency_ids: [...selectedIds] })
			});
			if (!res.ok) throw new Error(await res.text());
			selectedIds = new Set();
			fetchCurrencies();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	async function updateTaxInclusive(currency: Currency, value: boolean) {
		try {
			const res = await fetch(`${API_BASE}/currencies/${currency.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tax_inclusive_pricing: value })
			});
			if (!res.ok) throw new Error(await res.text());
			fetchCurrencies();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		}
	}

	// Add currencies sheet (123 list)
	let addOpen = $state(false);
	let availableData = $state<{ data: AvailableCurrency[]; pagination: Pagination } | null>(null);
	let availableLoading = $state(false);
	let availablePage = $state(1);
	let availableLimit = $state(50);
	let availableSearch = $state('');
	let availableSearchDebounced = $state('');
	let addSelected = $state<Map<string, boolean>>(new Map()); // code -> tax_inclusive_pricing
	let addSubmitting = $state(false);
	let addError = $state<string | null>(null);

	function openAdd() {
		addOpen = true;
		availablePage = 1;
		availableSearch = '';
		availableSearchDebounced = '';
		addSelected = new Map();
		addError = null;
	}

	function closeAdd() {
		addOpen = false;
	}

	async function fetchAvailable() {
		availableLoading = true;
		try {
			const params = new URLSearchParams({
				page: String(availablePage),
				limit: String(availableLimit),
				search: availableSearchDebounced
			});
			const res = await fetch(`${API_BASE}/currencies/available?${params}`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			availableData = (await res.json()) as { data: AvailableCurrency[]; pagination: Pagination };
		} catch (e) {
			addError = e instanceof Error ? e.message : String(e);
			availableData = null;
		} finally {
			availableLoading = false;
		}
	}

	$effect(() => {
		const t = setTimeout(() => {
			availableSearchDebounced = availableSearch;
		}, 300);
		return () => clearTimeout(t);
	});

	$effect(() => {
		if (!addOpen) return;
		const _ = availablePage;
		const __ = availableLimit;
		const ___ = availableSearchDebounced;
		fetchAvailable();
	});

	const availableList = $derived(availableData?.data ?? []);
	const availablePagination = $derived(availableData?.pagination ?? null);
	const toAdd = $derived(
		availableList.filter((c) => !c.active && addSelected.has(c.code))
	);

	function toggleAddSelect(item: AvailableCurrency) {
		if (item.active) return;
		addSelected = new Map(addSelected);
		if (addSelected.has(item.code)) addSelected.delete(item.code);
		else addSelected.set(item.code, item.tax_inclusive_pricing);
	}

	function setAddTaxInclusive(code: string, value: boolean) {
		addSelected = new Map(addSelected);
		addSelected.set(code, value);
	}

	function toggleAddSelectAll() {
		const notActive = availableList.filter((c) => !c.active);
		const allSelected = notActive.every((c) => addSelected.has(c.code));
		addSelected = new Map(addSelected);
		if (allSelected) {
			notActive.forEach((c) => addSelected.delete(c.code));
		} else {
			notActive.forEach((c) => addSelected.set(c.code, c.tax_inclusive_pricing));
		}
	}

	async function submitAdd() {
		const payload = toAdd.map((c) => ({
			code: c.code,
			tax_inclusive_pricing: addSelected.get(c.code) ?? false
		}));
		if (payload.length === 0) {
			closeAdd();
			return;
		}
		addSubmitting = true;
		addError = null;
		try {
			const res = await fetch(`${API_BASE}/currencies`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currencies: payload })
			});
			if (!res.ok) throw new Error(await res.text());
			closeAdd();
			fetchCurrencies();
		} catch (e) {
			addError = e instanceof Error ? e.message : String(e);
		} finally {
			addSubmitting = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4">
			<div class="flex items-center gap-2 text-sm text-muted-foreground">
				<a href="/settings" class="flex items-center gap-1 hover:text-foreground">Settings</a>
				<span>/</span>
				<span class="text-foreground">Currencies</span>
			</div>
		</div>
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-sm text-muted-foreground">
						Manage active currencies. You can only select from the fixed list of 123 currencies; extra currencies cannot be added.
					</p>
				</div>
				<Button size="sm" onclick={openAdd}>Add currencies</Button>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-2">
				{#if selectedIds.size > 0}
					<Button
						variant="outline"
						size="sm"
						class="rounded-md text-destructive hover:bg-destructive/10 hover:text-destructive"
						onclick={removeSelected}
					>
						<Trash2 class="mr-1.5 size-4" />
						Remove selected ({selectedIds.size})
					</Button>
				{:else}
					<Button variant="outline" size="sm" class="rounded-md">
						<SlidersHorizontal class="mr-1.5 size-4" />
						Add filter
					</Button>
				{/if}
			</div>
		</div>

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
					<thead class="sticky top-0 border-b bg-muted/50">
						<tr>
							<th class="w-10 px-4 py-3">
								<input
									type="checkbox"
									class="h-4 w-4 rounded border-input"
									checked={currencies.length > 0 && selectedIds.size === currencies.length}
									indeterminate={selectedIds.size > 0 && selectedIds.size < currencies.length}
									onchange={toggleSelectAll}
								/>
							</th>
							<th class="px-4 py-3 text-left font-medium">Code</th>
							<th class="px-4 py-3 text-left font-medium">Name</th>
							<th class="px-4 py-3 text-left font-medium">Tax inclusive pricing</th>
							<th class="w-10 px-4 py-3"></th>
						</tr>
					</thead>
					<tbody>
						{#if currencies.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No active currencies. Use “Add currencies” to select from the 123-currency list.
								</td>
							</tr>
						{:else}
							{#each currencies as currency (currency.id)}
								<tr class="border-b transition-colors hover:bg-muted/30">
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											checked={selectedIds.has(currency.id)}
											onchange={() => toggleSelect(currency.id)}
										/>
									</td>
									<td class="px-4 py-3 font-medium">{currency.code}</td>
									<td class="px-4 py-3 text-muted-foreground">{currency.name}</td>
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											checked={currency.tax_inclusive_pricing}
											onchange={(e) =>
												updateTaxInclusive(currency, (e.currentTarget as HTMLInputElement).checked)}
										/>
										<span class="ml-2 text-muted-foreground">
											{currency.tax_inclusive_pricing ? 'True' : 'False'}
										</span>
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
														textValue="Remove"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => removeCurrency(currency)}
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

			<div class="mt-4 flex items-center justify-between gap-4 border-t py-4">
				<p class="text-sm text-muted-foreground">
					{#if pagination && pagination.total > 0}
						{start} – {end} of {pagination.total} results
					{:else}
						0 results
					{/if}
				</p>
				<div class="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_previous_page}
						onclick={() => (page = page - 1)}
					>
						Prev
					</Button>
					<span class="text-sm text-muted-foreground">
						{pagination?.page ?? 1} of {pagination?.total_pages ?? 1} pages
					</span>
					<Button
						variant="outline"
						size="sm"
						disabled={!pagination?.has_next_page}
						onclick={() => (page = page + 1)}
					>
						Next
					</Button>
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Add currencies sheet (123 list) -->
<Sheet.Root bind:open={addOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="border-b p-4">
				<h2 class="text-lg font-semibold">Add currencies</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Select from the fixed list of 123 currencies. Only selected currencies will be added as active.
				</p>
				<div class="mt-4 flex items-center gap-2">
					<div class="relative flex-1">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={availableSearch}
							class="h-9 rounded-md pl-9"
						/>
					</div>
				</div>
			</div>
			{#if addError && !addSubmitting}
				<div class="mx-4 mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
					{addError}
				</div>
			{/if}
			<div class="min-h-0 flex-1 overflow-auto p-4">
				{#if availableLoading}
					<p class="text-muted-foreground">Loading…</p>
				{:else}
					<table class="w-full text-sm">
						<thead class="border-b bg-muted/50">
							<tr>
								<th class="w-10 px-4 py-3">
									<input
										type="checkbox"
										class="h-4 w-4 rounded border-input"
										checked={
											availableList.filter((c) => !c.active).length > 0 &&
											availableList.every((c) => c.active || addSelected.has(c.code))
										}
										onchange={toggleAddSelectAll}
									/>
								</th>
								<th class="px-4 py-3 text-left font-medium">Code</th>
								<th class="px-4 py-3 text-left font-medium">Name</th>
								<th class="px-4 py-3 text-left font-medium">Tax inclusive pricing</th>
							</tr>
						</thead>
						<tbody>
							{#each availableList as item (item.code)}
								<tr
									class={cn(
										'border-b transition-colors hover:bg-muted/30',
										item.active && 'opacity-60'
									)}
								>
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											disabled={item.active}
											checked={addSelected.has(item.code)}
											onchange={() => toggleAddSelect(item)}
										/>
									</td>
									<td class="px-4 py-3 font-medium">{item.code}</td>
									<td class="px-4 py-3 text-muted-foreground">{item.name}</td>
									<td class="px-4 py-3">
										<input
											type="checkbox"
											class="h-4 w-4 rounded border-input"
											disabled={item.active}
											checked={addSelected.get(item.code) ?? item.tax_inclusive_pricing}
											onchange={(e) =>
												setAddTaxInclusive(item.code, (e.currentTarget as HTMLInputElement).checked)}
										/>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				{/if}
				{#if availablePagination && availablePagination.total > 0}
					<div class="mt-4 flex items-center justify-between border-t pt-4">
						<p class="text-sm text-muted-foreground">
							{(availablePagination.page - 1) * availablePagination.limit + 1} –
							{Math.min(
								availablePagination.page * availablePagination.limit,
								availablePagination.total
							)}{' '}
							of {availablePagination.total} results
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!availablePagination.has_previous_page}
								onclick={() => (availablePage = availablePage - 1)}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{availablePagination.page} of {availablePagination.total_pages} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={!availablePagination.has_next_page}
								onclick={() => (availablePage = availablePage + 1)}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeAdd}>Cancel</Button>
				<Button
					onclick={submitAdd}
					disabled={addSubmitting || toAdd.length === 0}
				>
					{addSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
