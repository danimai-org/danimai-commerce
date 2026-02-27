<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DropdownMenu } from 'bits-ui';
	import Search from '@lucide/svelte/icons/search';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import Store from '@lucide/svelte/icons/store';
	import ArrowUpDown from '@lucide/svelte/icons/arrow-up-down';
	import { cn } from '$lib/utils.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';

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

	type Store = {
		id: string;
		name: string;
		default_currency_code: string | null;
		default_sales_channel_id: string | null;
		default_region_id: string | null;
		default_location_id: string | null;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type Region = {
		id: string;
		name: string;
		currency_code: string;
	};

	type SalesChannel = {
		id: string;
		name: string;
		description: string | null;
	};

	type StockLocation = {
		id: string;
		name: string | null;
	};

	// Store details from API (first store)
	let storeData = $state<Store | null>(null);
	let storeLoading = $state(true);
	async function fetchStore() {
		storeLoading = true;
		try {
			const res = await fetch(`${API_BASE}/stores?limit=1`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as { data: Store[]; pagination: Pagination };
			storeData = json.data[0] ?? null;
		} catch {
			storeData = null;
		} finally {
			storeLoading = false;
		}
	}
	$effect(() => {
		fetchStore();
	});

	// Load store options (regions, channels, locations) so we can show names in store details
	$effect(() => {
		if (storeData && !storeOptionsLoading && storeRegions.length === 0 && storeSalesChannels.length === 0)
			fetchStoreOptions();
	});

	// Edit store sheet
	let editStoreOpen = $state(false);
	let editStoreName = $state('');
	let editStoreDefaultCurrency = $state('');
	let editStoreDefaultRegion = $state('');
	let editStoreDefaultSalesChannel = $state('');
	let editStoreDefaultLocation = $state('');
	let editStoreSubmitting = $state(false);
	let editStoreError = $state<string | null>(null);

	// Options for dropdowns
	let storeRegions = $state<Region[]>([]);
	let storeSalesChannels = $state<SalesChannel[]>([]);
	let storeStockLocations = $state<StockLocation[]>([]);
	let storeCurrencies = $state<Currency[]>([]);
	let storeOptionsLoading = $state(false);

	async function fetchStoreOptions() {
		storeOptionsLoading = true;
		try {
			const [regionsRes, channelsRes, locationsRes, currenciesRes] = await Promise.all([
				fetch(`${API_BASE}/regions?limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/sales-channels?limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/stock-locations?limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/currencies?limit=100`, { cache: 'no-store' })
			]);

			if (regionsRes.ok) {
				const json = (await regionsRes.json()) as { data: Region[] };
				storeRegions = json.data;
			}
			if (channelsRes.ok) {
				const json = (await channelsRes.json()) as { data: SalesChannel[] };
				storeSalesChannels = json.data;
			}
			if (locationsRes.ok) {
				const json = (await locationsRes.json()) as { data: StockLocation[] };
				storeStockLocations = json.data;
			}
			if (currenciesRes.ok) {
				const json = (await currenciesRes.json()) as { data: Currency[] };
				storeCurrencies = json.data;
			}
		} catch (e) {
			console.error('Failed to fetch options:', e);
		} finally {
			storeOptionsLoading = false;
		}
	}

	function openEditStore() {
		if (!storeData) return;
		editStoreName = storeData.name;
		editStoreDefaultCurrency = storeData.default_currency_code?.toLowerCase() ?? '';
		editStoreDefaultRegion = storeData.default_region_id ?? '';
		editStoreDefaultSalesChannel = storeData.default_sales_channel_id ?? '';
		editStoreDefaultLocation = storeData.default_location_id ?? '';
		editStoreError = null;
		editStoreOpen = true;
		fetchStoreOptions();
	}

	function closeEditStore() {
		if (!editStoreSubmitting) {
			editStoreOpen = false;
			editStoreError = null;
		}
	}

	async function submitEditStore() {
		if (!storeData) return;
		editStoreError = null;
		editStoreSubmitting = true;
		try {
			const body: {
				name?: string;
				default_currency_code?: string | null;
				default_region_id?: string | null;
				default_sales_channel_id?: string | null;
				default_location_id?: string | null;
			} = {};
			if (editStoreName.trim() !== storeData.name) body.name = editStoreName.trim();
			if (editStoreDefaultCurrency !== (storeData.default_currency_code?.toLowerCase() ?? ''))
				body.default_currency_code = editStoreDefaultCurrency || null;
			if (editStoreDefaultRegion !== (storeData.default_region_id ?? ''))
				body.default_region_id = editStoreDefaultRegion || null;
			if (editStoreDefaultSalesChannel !== (storeData.default_sales_channel_id ?? ''))
				body.default_sales_channel_id = editStoreDefaultSalesChannel || null;
			if (editStoreDefaultLocation !== (storeData.default_location_id ?? ''))
				body.default_location_id = editStoreDefaultLocation || null;

			const res = await fetch(`${API_BASE}/stores/${storeData.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(await res.text());
			closeEditStore();
			fetchStore();
		} catch (e) {
			editStoreError = e instanceof Error ? e.message : String(e);
		} finally {
			editStoreSubmitting = false;
		}
	}

	const storeCurrencyOptions = $derived(
		storeCurrencies.map((c) => ({ id: c.code.toLowerCase(), value: `${c.code.toUpperCase()} - ${c.name}` }))
	);
	const storeRegionOptions = $derived(storeRegions.map((r) => ({ id: r.id, value: r.name })));
	const storeSalesChannelOptions = $derived(
		storeSalesChannels.map((sc) => ({ id: sc.id, value: sc.name }))
	);
	const storeLocationOptions = $derived(
		storeStockLocations.map((l) => ({ id: l.id, value: l.name || 'Unnamed location' }))
	);

	const storeDetails = $derived({
		name: storeData?.name ?? '—',
		defaultCurrency: storeData?.default_currency_code
			? storeData.default_currency_code.toUpperCase()
			: '—',
		defaultRegion:
			storeData?.default_region_id != null
				? storeRegions.find((r) => r.id === storeData!.default_region_id)?.name ?? '—'
				: '—',
		defaultSalesChannel:
			storeData?.default_sales_channel_id != null
				? storeSalesChannels.find((sc) => sc.id === storeData!.default_sales_channel_id)?.name ?? '—'
				: '—',
		defaultLocation:
			storeData?.default_location_id != null
				? storeStockLocations.find((l) => l.id === storeData!.default_location_id)?.name ??
					'Unnamed location'
				: '—'
	});

	// Active currencies
	let searchQuery = $state('');
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

	const filteredCurrencies = $derived(
		searchQuery.trim()
			? currencies.filter(
					(c) =>
						c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
						c.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
			: currencies
	);

	function toggleSelect(id: string) {
		selectedIds = new Set(selectedIds);
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
	}

	function toggleSelectAll() {
		if (selectedIds.size === filteredCurrencies.length) selectedIds = new Set();
		else selectedIds = new Set(filteredCurrencies.map((c) => c.id));
	}

	// Delete currency modal
	let deleteModalOpen = $state(false);
	let currencyToDelete = $state<Currency | null>(null);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);

	function openDeleteModal(currency: Currency) {
		currencyToDelete = currency;
		deleteModalOpen = true;
		deleteError = null;
	}

	function closeDeleteModal() {
		if (!deleteSubmitting) {
			deleteModalOpen = false;
			currencyToDelete = null;
			deleteError = null;
		}
	}

	async function removeCurrency() {
		if (!currencyToDelete) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			const res = await fetch(`${API_BASE}/currencies`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currency_ids: [currencyToDelete.id] })
			});
			if (!res.ok) throw new Error(await res.text());
			selectedIds = new Set(selectedIds);
			selectedIds.delete(currencyToDelete.id);
			fetchCurrencies();
			deleteModalOpen = false;
			currencyToDelete = null;
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
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

	// Edit currency sheet
	let editOpen = $state(false);
	let editCurrency = $state<Currency | null>(null);
	let editTaxInclusive = $state(false);
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(currency: Currency) {
		editCurrency = currency;
		editOpen = true;
		editTaxInclusive = currency.tax_inclusive_pricing;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editCurrency = null;
	}

	async function submitEdit() {
		if (!editCurrency) return;
		editError = null;
		editSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/currencies/${editCurrency.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tax_inclusive_pricing: editTaxInclusive })
			});
			if (!res.ok) throw new Error(await res.text());
			closeEdit();
			fetchCurrencies();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	// Add currencies sheet
	let addOpen = $state(false);
	let availableData = $state<{ data: AvailableCurrency[]; pagination: Pagination } | null>(null);
	let availableLoading = $state(false);
	let availablePage = $state(1);
	let availableLimit = $state(50);
	let availableSearch = $state('');
	let availableSearchDebounced = $state('');
	let addSelected = $state<Map<string, boolean>>(new Map());
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
			const res = await fetch(`${API_BASE}/currencies/available?${params}`, {
				cache: 'no-store'
			});
			if (!res.ok) throw new Error(await res.text());
			availableData = (await res.json()) as {
				data: AvailableCurrency[];
				pagination: Pagination;
			};
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
	const toAdd = $derived(availableList.filter((c) => !c.active && addSelected.has(c.code)));

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
			<div class="flex items-center gap-2">
				<Store class="size-5 text-foreground" />
				<span class="text-lg font-semibold text-foreground">Store</span>
			</div>
		</div>

		<!-- Store details section -->
		<div class="mb-8">
			<div class="mb-4 flex items-start justify-between gap-4">
				<div>
					<p class="text-sm text-muted-foreground">Manage your store's details.</p>
				</div>
				<DropdownMenu.Root>
					<DropdownMenu.Trigger
						class="flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
					>
						<MoreHorizontal class="size-4" />
						<span class="sr-only">Store menu</span>
					</DropdownMenu.Trigger>
					<DropdownMenu.Portal>
						<DropdownMenu.Content
							class="z-50 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
							sideOffset={4}
						>
							<DropdownMenu.Item
								textValue="Edit"
								class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
								onSelect={openEditStore}
							>
								<Pencil class="size-4" />
								Edit
							</DropdownMenu.Item>
						</DropdownMenu.Content>
					</DropdownMenu.Portal>
				</DropdownMenu.Root>
			</div>
			<div class="rounded-lg border bg-card p-4">
				{#if storeLoading}
					<p class="text-sm text-muted-foreground">Loading store…</p>
				{:else}
					<dl class="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Name</dt>
							<dd class="mt-1 text-sm text-foreground">{storeDetails.name}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Default currency</dt>
							<dd class="mt-1">
								<span
									class="inline-flex items-center rounded-md border bg-muted px-2 py-0.5 text-xs font-medium"
								>
									{storeDetails.defaultCurrency}
								</span>
							</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Default region</dt>
							<dd class="mt-1 text-sm text-foreground">{storeDetails.defaultRegion}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Default sales channel</dt>
							<dd class="mt-1 text-sm text-foreground">{storeDetails.defaultSalesChannel}</dd>
						</div>
						<div>
							<dt class="text-sm font-medium text-muted-foreground">Default location</dt>
							<dd class="mt-1 text-sm text-foreground">{storeDetails.defaultLocation}</dd>
						</div>
					</dl>
				{/if}
			</div>
		</div>

		<!-- Currencies section -->
		<div class="mb-6 flex flex-col gap-4">
			<div class="flex items-start justify-between gap-4">
				<div>
					<h2 class="text-lg font-semibold">Currencies</h2>
					<p class="mt-1 text-sm text-muted-foreground">Manage active currencies for your store.</p>
				</div>
				<div class="flex items-center gap-2">
					<Button size="sm" onclick={openAdd}>Add currencies</Button>
				</div>
			</div>
			<div class="flex flex-wrap items-center justify-between gap-2">
				<div class="flex items-center gap-2">
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
				<div class="flex items-center gap-2">
					<div class="relative w-64">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={searchQuery}
							class="h-9 rounded-md pl-9"
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
									checked={filteredCurrencies.length > 0 &&
										selectedIds.size === filteredCurrencies.length}
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
						{#if filteredCurrencies.length === 0}
							<tr>
								<td colspan="5" class="px-4 py-8 text-center text-muted-foreground">
									No currencies found.
								</td>
							</tr>
						{:else}
							{#each filteredCurrencies as currency (currency.id)}
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
										<span class="text-muted-foreground">
											• {currency.tax_inclusive_pricing ? 'True' : 'False'}
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
														textValue="Edit"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors outline-none select-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openEdit(currency)}
													>
														<Pencil class="size-4" />
														Edit
													</DropdownMenu.Item>
													<DropdownMenu.Item
														textValue="Remove"
														class="relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive transition-colors outline-none select-none hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
														onSelect={() => openDeleteModal(currency)}
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

<!-- Edit currency sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit currency</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update tax inclusive pricing for {editCurrency?.code ?? ''}.
				</p>
				{#if editError && !editSubmitting}
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
							id="edit-tax-inclusive"
							bind:checked={editTaxInclusive}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="edit-tax-inclusive" class="text-sm font-medium">Tax inclusive pricing</label
						>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Add currencies sheet -->
<Sheet.Root bind:open={addOpen}>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="border-b p-4">
				<h2 class="text-lg font-semibold">Add currencies</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Select from the fixed list of 123 currencies. Only selected currencies will be added as
					active.
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
				<div
					class="mx-4 mt-2 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
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
										checked={availableList.filter((c) => !c.active).length > 0 &&
											availableList.every((c) => c.active || addSelected.has(c.code))}
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
												setAddTaxInclusive(
													item.code,
													(e.currentTarget as HTMLInputElement).checked
												)}
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
				<Button onclick={submitAdd} disabled={addSubmitting || toAdd.length === 0}>
					{addSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Delete currency confirmation modal -->
<DeleteConfirmationModal
	bind:open={deleteModalOpen}
	entityName="currency"
	entityTitle={currencyToDelete ? `${currencyToDelete.code} (${currencyToDelete.name})` : ''}
	onConfirm={removeCurrency}
	onCancel={closeDeleteModal}
	submitting={deleteSubmitting}
	error={deleteError}
	customMessage={currencyToDelete ? `Are you sure you want to remove ${currencyToDelete.code} (${currencyToDelete.name})? This action cannot be undone.` : undefined}
/>

<!-- Edit store sheet -->
<Sheet.Root bind:open={editStoreOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit store</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update your store's details.</p>
				{#if editStoreError && !editStoreSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editStoreError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-store-name" class="text-sm font-medium">Name</label>
						<Input
							id="edit-store-name"
							type="text"
							bind:value={editStoreName}
							placeholder="Store name"
							class="h-9"
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-currency" class="text-sm font-medium">Default currency</label>
						<Combobox
							id="edit-store-currency"
							options={storeCurrencyOptions}
							bind:value={editStoreDefaultCurrency}
							placeholder="Select currency"
							disabled={storeOptionsLoading}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-region" class="text-sm font-medium">Default region</label>
						<Combobox
							id="edit-store-region"
							options={storeRegionOptions}
							bind:value={editStoreDefaultRegion}
							placeholder="Select region"
							disabled={storeOptionsLoading}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-sales-channel" class="text-sm font-medium"
							>Default sales channel</label
						>
						<Combobox
							id="edit-store-sales-channel"
							options={storeSalesChannelOptions}
							bind:value={editStoreDefaultSalesChannel}
							placeholder="Select sales channel"
							disabled={storeOptionsLoading}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-store-location" class="text-sm font-medium">Default location</label>
						<Combobox
							id="edit-store-location"
							options={storeLocationOptions}
							bind:value={editStoreDefaultLocation}
							placeholder="Select location"
							disabled={storeOptionsLoading}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEditStore} disabled={editStoreSubmitting}>Cancel</Button>
				<Button onclick={submitEditStore} disabled={editStoreSubmitting || storeOptionsLoading}>
					{editStoreSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
