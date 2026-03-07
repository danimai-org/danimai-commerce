<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
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
	import {
		DeleteConfirmationModal,
		CurrencyFormSheet,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import {
		listCurrencies,
		deleteCurrencies,
		listAvailableCurrencies,
		createCurrencies
	} from '$lib/currencies/api.js';
	import type {
		Currency,
		CurrenciesListResponse,
		AvailableCurrency,
		AvailableCurrenciesResponse
	} from '$lib/currencies/types.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { createQuery } from '@tanstack/svelte-query';

	const API_BASE = 'http://localhost:8000/admin';

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

	type StoreListPagination = {
		total: number;
		page: number;
		limit: number;
		total_pages: number;
		has_next_page: boolean;
		has_previous_page: boolean;
	};

	// Store details from API (first store)
	let storeData = $state<Store | null>(null);
	let storeLoading = $state(true);
	async function fetchStore() {
		storeLoading = true;
		try {
			const res = await fetch(`${API_BASE}/stores?limit=100`, { cache: 'no-store' });
			if (!res.ok) throw new Error(await res.text());
			const json = (await res.json()) as { rows: Store[]; pagination: StoreListPagination };
			storeData = json.rows[0] ?? null;
		} catch (e) {
			console.error('Failed to fetch store:', e);
			storeData = null;
		}
	}

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
			const [regionsRes, channelsRes, locationsRes, currenciesData] = await Promise.all([
				fetch(`${API_BASE}/regions?limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/sales-channels?limit=100`, { cache: 'no-store' }),
				fetch(`${API_BASE}/stock-locations?limit=100`, { cache: 'no-store' }),
				listCurrencies({ limit: 100 })
			]);

			if (regionsRes.ok) {
				const json = (await regionsRes.json()) as { rows: Region[] };
				storeRegions = json.rows ?? [];
			}
			if (channelsRes.ok) {
				const json = (await channelsRes.json()) as { rows: SalesChannel[] };
				storeSalesChannels = json.rows ?? [];
			}
			if (locationsRes.ok) {
				const json = (await locationsRes.json()) as { rows: StockLocation[] };
				storeStockLocations = json.rows ?? [];
			}
			storeCurrencies = currenciesData.rows;
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

	// Currencies list: URL pagination + createPagination
	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => listCurrencies(paginationQuery),
		['currencies']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as CurrenciesListResponse | undefined);
	const rows = $derived(queryData?.rows ?? []);
	const pagination = $derived(queryData?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openEdit = $derived(paginateState.openEdit);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeForm = $derived(paginateState.closeForm);
	const deleteConfirmOpen = $derived(paginateState.deleteConfirmOpen);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);

	let selectedIds = $state<Set<string>>(new Set());

	function toggleSelect(id: string) {
		selectedIds = new Set(selectedIds);
		if (selectedIds.has(id)) selectedIds.delete(id);
		else selectedIds.add(id);
	}

	function toggleSelectAll() {
		if (selectedIds.size === rows.length) selectedIds = new Set();
		else selectedIds = new Set((rows as Currency[]).map((c) => c.id));
	}

	async function removeSelected() {
		if (selectedIds.size === 0) return;
		try {
			await deleteCurrencies([...selectedIds]);
			selectedIds = new Set();
			refetch();
		} catch (e) {
			// error surfaces via paginateState or we could set local error
			refetch();
		}
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Code', key: 'code', type: 'text' },
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Tax inclusive pricing', key: 'tax_inclusive_pricing', type: 'boolean' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEdit(item as Parameters<typeof openEdit>[0])
				},
				{
					label: 'Remove',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as Parameters<typeof openDeleteConfirm>[0])
				}
			]
		}
	];

	const selectAllChecked = $derived(rows.length > 0 && selectedIds.size === rows.length);
	const selectAllIndeterminate = $derived(selectedIds.size > 0 && selectedIds.size < rows.length);

	// Add currencies sheet: pagination from URL (add_page, add_limit, add_currency_code), same structure
	let addOpen = $state(false);
	let addSelected = $state<Map<string, boolean>>(new Map());
	let addSubmitting = $state(false);
	let addError = $state<string | null>(null);

	const addPaginationQuery = $derived.by(() => {
		const p = page.url.searchParams;
		return {
			page: Number(p.get('add_page')) || 1,
			limit: Number(p.get('add_limit')) || 10,
			search: p.get('add_currency_code') ?? ''
		};
	});

	const availableQuery = createQuery(() => ({
		queryKey: ['pagination', 'availableCurrencies', addPaginationQuery],
		queryFn: () => listAvailableCurrencies(addPaginationQuery),
		enabled: addOpen
	}));

	const availableQueryData = $derived(availableQuery.data as AvailableCurrenciesResponse | undefined);
	const availableList = $derived(availableQueryData?.data ?? []);
	const availablePagination = $derived(availableQueryData?.pagination ?? null);
	const availableLoading = $derived(availableQuery.isPending);
	const availableStart = $derived(
		availablePagination ? (availablePagination.page - 1) * availablePagination.limit + 1 : 0
	);
	const availableEnd = $derived(
		availablePagination
			? Math.min(availablePagination.page * availablePagination.limit, availablePagination.total)
			: 0
	);

	function goToAvailablePage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('add_page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function openAdd() {
		addOpen = true;
		addError = null;
		addSelected = new Map();
		const params = new URLSearchParams(page.url.searchParams);
		params.set('add_page', '1');
		params.set('add_limit', '10');
		if (!params.has('add_currency_code')) params.set('add_currency_code', '');
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function closeAdd() {
		if (!addSubmitting) {
			addOpen = false;
			addError = null;
			addSelected = new Map();
		}
	}

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
			await createCurrencies({ currencies: payload });
			closeAdd();
			refetch();
		} catch (e) {
			addError = e instanceof Error ? e.message : String(e);
		} finally {
			addSubmitting = false;
		}
	}
</script>

<svelte:head>
    <title>
        {editStoreSubmitting ? '● Saving... ' : ''}
        {storeData?.name ? `${storeData.name} | Settings` : 'Store Settings'}
    </title>
    <meta name="description" content="Manage store details and active currencies." />
</svelte:head>
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
				<Button size="sm" onclick={openAdd}>Add currencies</Button>
			</div>
			<div class="mb-6 flex flex-wrap items-center justify-between gap-2">
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
						<Input type="search" placeholder="Search" class="h-9 rounded-md pl-9" />
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
						<TableHead
							columns={tableColumns}
							showSelectAll={true}
							selectAllChecked={selectAllChecked}
							selectAllIndeterminate={selectAllIndeterminate}
							onToggleSelectAll={toggleSelectAll}
						/>
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No currencies found."
							selectedIds={selectedIds}
							onToggleSelect={toggleSelect}
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
		</div>
	</div>
</div>

<CurrencyFormSheet
	bind:open={paginateState.formSheetOpen}
	currency={(formItem as unknown) as Currency | null}
	onSuccess={refetch}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="currency"
	entityTitle={((deleteItem as unknown) as Currency | null)
		? `${((deleteItem as unknown) as Currency).code} (${((deleteItem as unknown) as Currency).name})`
		: ''}
	onConfirm={() => confirmDelete((item) => deleteCurrencies([((item as unknown) as Currency).id]))}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
	customMessage={((deleteItem as unknown) as Currency | null)
		? `Are you sure you want to remove ${((deleteItem as unknown) as Currency).code} (${((deleteItem as unknown) as Currency).name})? This action cannot be undone.`
		: undefined}
/>
{#if deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{deleteError}
	</div>
{/if}

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
							placeholder="Search by currency code"
							value={page.url.searchParams.get('add_currency_code') ?? ''}
							oninput={(e) => {
								const params = new URLSearchParams(page.url.searchParams);
								params.set('add_currency_code', (e.currentTarget as HTMLInputElement).value);
								params.set('add_page', '1');
								goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
							}}
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
							{availableStart} – {availableEnd} of {availablePagination.total} results
						</p>
						<div class="flex gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={!availablePagination.has_previous_page}
								onclick={() => goToAvailablePage(availablePagination.page - 1)}
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
								onclick={() => goToAvailablePage(availablePagination.page + 1)}
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
