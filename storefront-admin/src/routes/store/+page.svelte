<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import Store from '@lucide/svelte/icons/store';
	import {
		DeleteConfirmationModal,
		CurrencyFormSheet,
		AddCurrenciesSheet,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Combobox from '$lib/components/organs/combobox/combobox.svelte';
	import { listCurrencies, deleteCurrencies } from '$lib/currencies/api.js';
	import type { Currency, CurrenciesListResponse } from '$lib/currencies/types.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';

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

	type StoresListResponse = { rows: Store[]; pagination: StoreListPagination };

	// Store list: URL pagination (store_page, store_limit) + createPagination, like currencies
	const storePaginationQuery = $derived.by(() => {
		const sp = page.url.searchParams;
		return createPaginationQuery(
			new URLSearchParams({
				page: sp.get('store_page') ?? '1',
				limit: sp.get('store_limit') ?? '10'
			})
		);
	});

	async function listStores(query: ReturnType<typeof createPaginationQuery>) {
		const params = new URLSearchParams();
		if (query.page != null) params.set('page', String(query.page));
		if (query.limit != null) params.set('limit', String(query.limit));
		const res = await fetch(`${API_BASE}/stores?${params}`, { cache: 'no-store' });
		if (!res.ok) throw new Error(await res.text());
		return res.json() as Promise<StoresListResponse>;
	}

	const storePaginateState = createPagination(
		async () => listStores(storePaginationQuery),
		['stores']
	);

	const storeQueryData = $derived(storePaginateState.query.data as StoresListResponse | undefined);
	const storeRows = $derived(storeQueryData?.rows ?? []);
	const storePagination = $derived(storeQueryData?.pagination ?? null);
	const storeStart = $derived(storePaginateState.start);
	const storeEnd = $derived(storePaginateState.end);

	function goToStorePage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('store_page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
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

	let storeToEdit = $state<Store | null>(null);

	function openEditStore(store: Store) {
		storeToEdit = store;
		editStoreName = store.name;
		editStoreDefaultCurrency = store.default_currency_code?.toLowerCase() ?? '';
		editStoreDefaultRegion = store.default_region_id ?? '';
		editStoreDefaultSalesChannel = store.default_sales_channel_id ?? '';
		editStoreDefaultLocation = store.default_location_id ?? '';
		editStoreError = null;
		editStoreOpen = true;
		fetchStoreOptions();
	}

	function closeEditStore() {
		if (!editStoreSubmitting) {
			editStoreOpen = false;
			editStoreError = null;
			storeToEdit = null;
		}
	}

	async function submitEditStore() {
		if (!storeToEdit) return;
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
			if (editStoreName.trim() !== storeToEdit.name) body.name = editStoreName.trim();
			if (editStoreDefaultCurrency !== (storeToEdit.default_currency_code?.toLowerCase() ?? ''))
				body.default_currency_code = editStoreDefaultCurrency || null;
			if (editStoreDefaultRegion !== (storeToEdit.default_region_id ?? ''))
				body.default_region_id = editStoreDefaultRegion || null;
			if (editStoreDefaultSalesChannel !== (storeToEdit.default_sales_channel_id ?? ''))
				body.default_sales_channel_id = editStoreDefaultSalesChannel || null;
			if (editStoreDefaultLocation !== (storeToEdit.default_location_id ?? ''))
				body.default_location_id = editStoreDefaultLocation || null;

			const res = await fetch(`${API_BASE}/stores/${storeToEdit.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) throw new Error(await res.text());
			closeEditStore();
			storePaginateState.refetch();
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

	const storeTableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Default currency', key: 'default_currency_code', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEditStore(item as Store)
				}
			]
		}
	];

	let addOpen = $state(false);
	function openAdd() {
		addOpen = true;
	}
</script>

<svelte:head>
	<title>Store | Danimai Store</title>
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

		<!-- Stores list: PaginationTable + paginationQuery like currencies -->
		<div class="mb-8 flex flex-col gap-4">
			<div>
				<h2 class="text-lg font-semibold">Stores</h2>
				<p class="mt-1 text-sm text-muted-foreground">Manage your stores.</p>
			</div>
			<PaginationTable>
				{#if storePaginateState.error}
					<div
						class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
					>
						{storePaginateState.error}
					</div>
				{:else if storePaginateState.loading}
					<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
						<p class="text-muted-foreground">Loading…</p>
					</div>
				{:else}
					<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
						<table class="w-full text-sm">
							<TableHead columns={storeTableColumns} />
							<TableBody
								rows={storeRows}
								columns={storeTableColumns}
								emptyMessage="No stores found."
							/>
						</table>
					</div>
					<TablePagination
						pagination={storePagination}
						start={storeStart}
						end={storeEnd}
						onPageChange={goToStorePage}
					/>
				{/if}
			</PaginationTable>
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
			{#if selectedIds.size > 0}
				<div class="flex items-center gap-2">
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
			</PaginationTable>
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

<AddCurrenciesSheet bind:open={addOpen} onSuccess={refetch} />

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
