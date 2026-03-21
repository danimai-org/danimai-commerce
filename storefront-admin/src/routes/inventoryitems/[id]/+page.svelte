<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { createQuery } from '@tanstack/svelte-query';
	import {
		DetailHeaderCards,
		ResourceTableCard,
		ReservationsCard,
		AddVariantSheet,
		EditDetailsSheet,
		ManageLocationsSheet
	} from '$lib/components/organs/inventoryitems/detail/index.js';
	import { DeleteConfirmationModal, type TableColumn } from '$lib/components/organs/index.js';
	import { createPaginationQuery, createPagination, type PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client.js';

	const itemId = $derived(page.params?.id ?? '');

	type InventoryItem = {
		id: string;
		sku: string | null;
		requires_shipping: boolean;
		metadata: unknown | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type InventoryLevel = {
		id: string;
		inventory_item_id: string;
		location_id: string;
		stocked_quantity: number;
		reserved_quantity: number;
		available_quantity: number;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type ReservationItem = {
		id: string;
		inventory_item_id: string;
		location_id: string;
		quantity: number;
		line_item_id: string | null;
		description: string | null;
		created_at: string;
		updated_at: string;
		deleted_at: string | null;
	};

	type ProductVariant = {
		id: string;
		title: string;
		sku: string | null;
		product_id: string | null;
		thumbnail?: string | null;
	};

	type LevelWithLocation = InventoryLevel & {
		location?: { id: string; name: string | null } | null;
	};
	type ProductSummaryFromApi = {
		id: string;
		title: string | null;
		thumbnail: string | null;
	};
	type DetailData = {
		item: InventoryItem;
		levels: LevelWithLocation[];
		reservations: ReservationItem[];
		associated_variants?: ProductVariant[];
		product_summaries?: Record<string, ProductSummaryFromApi>;
	};

	type StockLocation = {
		id: string;
		name: string | null;
	};

	/** API returns item fields + inventory_levels + reservation_items (see RetrieveInventoryItemProcess). */
	type RetrieveInventoryItemApiBody = Omit<DetailData, 'item' | 'levels' | 'reservations'> &
		InventoryItem & {
			inventory_levels: LevelWithLocation[];
			reservation_items: ReservationItem[];
		};

	function mapRetrieveBodyToDetailData(raw: unknown): DetailData | null {
		if (raw == null || typeof raw !== 'object') return null;
		const o = raw as Record<string, unknown>;
		if ('item' in o && o.item != null && typeof o.item === 'object') {
			return raw as DetailData;
		}
		const {
			inventory_levels,
			reservation_items,
			associated_variants,
			product_summaries,
			...itemRest
		} = raw as RetrieveInventoryItemApiBody;
		return {
			item: itemRest as InventoryItem,
			levels: inventory_levels ?? [],
			reservations: reservation_items ?? [],
			associated_variants,
			product_summaries
		};
	}

	function clientPaginationMeta(total: number, pageNum: number, limit: number): PaginationMeta {
		const total_pages = Math.max(1, Math.ceil(total / limit));
		const safePage = Math.max(1, Math.min(pageNum, total_pages));
		return {
			total,
			page: safePage,
			limit,
			total_pages,
			has_next_page: safePage < total_pages,
			has_previous_page: safePage > 1
		};
	}

	const itemDetailQuery = createQuery(() => ({
		queryKey: ['inventory-item-detail', itemId],
		queryFn: async (): Promise<DetailData | null> => {
			if (!itemId) return null;
			const res = await client.inventory.items({ id: itemId }).get();
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to get inventory item detail'));
			}
			return mapRetrieveBodyToDetailData(res?.data);
		}
	}));

	const data = $derived(itemDetailQuery.data ?? null);
	const loading = $derived(itemDetailQuery.isPending && itemDetailQuery.isFetching);
	const error = $derived(
		itemDetailQuery.error != null
			? itemDetailQuery.error instanceof Error
				? itemDetailQuery.error.message
				: String(itemDetailQuery.error)
			: data === null && itemDetailQuery.isSuccess && itemId
				? 'Inventory item not found'
				: null
	);

	let manageLocationsSheetOpen = $state(false);
	let editDetailsSheetOpen = $state(false);
	let editDetailsSku = $state('');
	let editDetailsRequiresShipping = $state(true);
	let editDetailsSaving = $state(false);
	let editDetailsError = $state<string | null>(null);
	let addVariantSheetOpen = $state(false);
	let addVariantProductId = $state('');
	let addVariantTitle = $state('');
	let addVariantSubmitting = $state(false);
	let addVariantError = $state<string | null>(null);
	let productsList = $state<{ id: string; title: string }[]>([]);
	let deleteItemModalOpen = $state(false);
	let deleteItemSubmitting = $state(false);
	let deleteItemError = $state<string | null>(null);

	/** Defer open so the triggering click is not handled as an outside dismiss (bits-ui / Radix). */
	function openManageLocationsSheet() {
		setTimeout(() => {
			manageLocationsSheetOpen = true;
		}, 0);
	}

	const displayName = $derived(
		data?.item?.sku ?? data?.item?.id?.slice(0, 8) ?? 'Inventory Item'
	);

	const totals = $derived.by(() => {
		if (!data?.levels?.length) {
			return { inStock: 0, reserved: 0, available: 0, locationCount: 0 };
		}
		const inStock = data.levels.reduce((s, l) => s + l.stocked_quantity, 0);
		const reserved = data.levels.reduce((s, l) => s + l.reserved_quantity, 0);
		const available = data.levels.reduce((s, l) => s + l.available_quantity, 0);
		return {
			inStock,
			reserved,
			available,
			locationCount: data.levels.length
		};
	});

	const productTitles = $derived(
		Object.fromEntries(
			Object.entries(data?.product_summaries ?? {}).map(([id, s]) => [id, s.title ?? '–'])
		)
	);

	const levelsPage = $derived(Math.max(1, parseInt(page.url.searchParams.get('levels_page') ?? '1', 10) || 1));
	const levelsLimit = $derived(Math.max(1, Math.min(100, parseInt(page.url.searchParams.get('levels_limit') ?? '10', 10) || 10)));
	const variantsPage = $derived(Math.max(1, parseInt(page.url.searchParams.get('variants_page') ?? '1', 10) || 1));
	const variantsLimit = $derived(Math.max(1, Math.min(100, parseInt(page.url.searchParams.get('variants_limit') ?? '10', 10) || 10)));
	const locationsSheetPage = $derived(
		Math.max(1, parseInt(page.url.searchParams.get('locations_sheet_page') ?? '1', 10) || 1)
	);
	const locationsSheetLimit = $derived(
		Math.max(1, Math.min(100, parseInt(page.url.searchParams.get('locations_sheet_limit') ?? '10', 10) || 10))
	);

	const levelsTotal = $derived(data?.levels?.length ?? 0);
	const levelsPaginationMeta = $derived(clientPaginationMeta(levelsTotal, levelsPage, levelsLimit));
	const levelsOffset = $derived((levelsPaginationMeta.page - 1) * levelsLimit);
	const levelsRows = $derived(data?.levels?.slice(levelsOffset, levelsOffset + levelsLimit) ?? []);
	const levelsStart = $derived(levelsTotal === 0 ? 0 : levelsOffset + 1);
	const levelsEnd = $derived(Math.min(levelsOffset + levelsLimit, levelsTotal));

	function goToLevelsPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('levels_page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const variantsTotal = $derived((data?.associated_variants ?? []).length);
	const variantsPaginationMeta = $derived(clientPaginationMeta(variantsTotal, variantsPage, variantsLimit));
	const variantsOffset = $derived((variantsPaginationMeta.page - 1) * variantsLimit);
	const variantsRows = $derived(
		(data?.associated_variants ?? []).slice(variantsOffset, variantsOffset + variantsLimit)
	);
	const variantsStart = $derived(variantsTotal === 0 ? 0 : variantsOffset + 1);
	const variantsEnd = $derived(Math.min(variantsOffset + variantsLimit, variantsTotal));

	function goToVariantsPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('variants_page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function goToLocationsSheetPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('locations_sheet_page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const stockLocationsPaginateState = createPagination(
		async () =>
			client['stock-locations'].get({
				query: createPaginationQuery(
					new URLSearchParams({
						page: String(locationsSheetPage),
						limit: String(locationsSheetLimit)
					})
				)
			}),
		['stock-locations-picker']
	);

	$effect(() => {
		manageLocationsSheetOpen;
		locationsSheetPage;
		locationsSheetLimit;
		if (manageLocationsSheetOpen) {
			stockLocationsPaginateState.refetch();
		}
	});

	const stockLocationsRows = $derived(
		(stockLocationsPaginateState.query.data?.data?.rows ?? []) as unknown as StockLocation[]
	);
	const stockLocationsPagination = $derived(stockLocationsPaginateState.query.data?.data?.pagination ?? null);
	const stockLocationsStart = $derived(stockLocationsPaginateState.start);
	const stockLocationsEnd = $derived(stockLocationsPaginateState.end);
	const stockLocationsLoading = $derived(stockLocationsPaginateState.loading);

	const levelsColumns: TableColumn[] = [
		{ label: 'Location', key: 'location_name', type: 'text' },
		{ label: 'Reserved', key: 'reserved_quantity', type: 'text' },
		{ label: 'In stock', key: 'stocked_quantity', type: 'text' },
		{ label: 'Available', key: 'available_quantity', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: openManageLocationsSheet
				}
			]
		}
	];

	const levelsRowsForTable = $derived(
		levelsRows.map((level) => ({
			...level,
			location_name: level.location?.name ?? level.location_id
		}))
	);

	const variantsColumns: TableColumn[] = [
		{ label: 'Product', key: 'product_title', type: 'text' },
		{ label: 'Variant title', key: 'title', type: 'text' },
		{ label: 'SKU', key: 'sku', type: 'text' },
		{
			label: 'Link',
			key: 'product_id',
			type: 'link',
			cellHref: (row) => `/products/${(row as { product_id: string | null }).product_id ?? ''}`,
			textKey: 'product_id',
			linkLabel: 'View'
		}
	];

	const variantsRowsForTable = $derived(
		variantsRows.map((v) => ({
			...v,
			product_title: v.product_id ? (productTitles[v.product_id] ?? '–') : '–'
		}))
	);

	function openAddVariantSheet() {
		addVariantSheetOpen = true;
		addVariantError = null;
		addVariantProductId = '';
		addVariantTitle = '';
		(async () => {
			try {
				const res = await client.products.get({
					query: { page: 1, limit: 100 } as Record<string, string | number>
				});
				if (res?.error) {
					throw new Error(String(res?.error?.value?.message ?? 'Failed to load products'));
				}
				const payload = res.data as { data?: { rows?: { id: string; title: string | null }[] } };
				productsList = (payload?.data?.rows ?? []).map((product) => ({
					id: product.id,
					title: product.title ?? product.id
				}));
			} catch {
				productsList = [];
			}
		})();
	}

	async function submitAddVariant() {
		if (!addVariantProductId || !addVariantTitle.trim()) return;
		addVariantError = null;
		addVariantSubmitting = true;
		try {
			addVariantError =
				'The admin API has no endpoint to create variants from here. Open the product in Products and add a variant whose SKU matches this inventory item.';
		} finally {
			addVariantSubmitting = false;
		}
	}

	function openEditDetailsSheet() {
		if (!data?.item) return;
		editDetailsSheetOpen = true;
		editDetailsError = null;
		editDetailsSku = data.item.sku ?? '';
		editDetailsRequiresShipping = data.item.requires_shipping;
	}

	async function saveEditDetails() {
		if (!data?.item?.id) return;
		editDetailsError = null;
		editDetailsSaving = true;
		try {
			const res = await client.inventory.items({ id: data.item.id }).put({
				sku: editDetailsSku.trim() || null,
				requires_shipping: editDetailsRequiresShipping
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to save inventory item details'));
			}
			editDetailsSheetOpen = false;
			await itemDetailQuery.refetch();
		} catch (e) {
			editDetailsError = e instanceof Error ? e.message : String(e);
		} finally {
			editDetailsSaving = false;
		}
	}

	function closeDeleteItemConfirm() {
		if (!deleteItemSubmitting) {
			deleteItemModalOpen = false;
			deleteItemError = null;
		}
	}

	async function confirmDeleteItem() {
		if (!data?.item?.id) return;
		deleteItemSubmitting = true;
		deleteItemError = null;
		try {
			const res = await client.inventory.items.delete({ ids: [data.item.id] });
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to delete inventory item'));
			}
			deleteItemModalOpen = false;
			goto('/inventoryitems');
		} catch (e) {
			deleteItemError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteItemSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{displayName} | Inventory | Danimai Store</title>
	<meta name="description" content="Manage inventory item." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground">
			<a href="/inventoryitems" class="hover:text-foreground">Inventory</a>
			<span>/</span>
			<span class="text-foreground">{displayName}</span>
			{#if data && !loading}
				<span class="ml-2 text-muted-foreground">·</span>
				<span>In stock: <span class="font-medium text-foreground">{totals.inStock}</span></span>
				<span>Available: <span class="font-medium text-foreground">{totals.available}</span></span>
			{/if}
		</div>

		{#if error}
			<div
				class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
			>
				{error}
			</div>
		{:else if loading}
			<div class="flex min-h-0 flex-1 items-center justify-center">
				<p class="text-muted-foreground">Loading…</p>
			</div>
		{:else if data}
			<div class="flex flex-col gap-6">
				<DetailHeaderCards
					displayName={displayName}
					sku={data.item.sku}
					{totals}
					onEditDetails={openEditDetailsSheet}
					onAddVariant={openAddVariantSheet}
				/>

				<ResourceTableCard
					title="Associated variants"
					columns={variantsColumns}
					rows={variantsRowsForTable}
					emptyMessage="No associated variants."
					pagination={variantsPaginationMeta}
					start={variantsStart}
					end={variantsEnd}
					onPageChange={goToVariantsPage}
				/>

				<ResourceTableCard
					title="Locations"
					columns={levelsColumns}
					rows={levelsRowsForTable}
					emptyMessage="No locations."
					pagination={levelsPaginationMeta}
					start={levelsStart}
					end={levelsEnd}
					onPageChange={goToLevelsPage}
					actionLabel="Manage locations"
					onActionClick={openManageLocationsSheet}
				/>

				<ReservationsCard />
			</div>
		{/if}
	</div>
</div>


<AddVariantSheet
	bind:open={addVariantSheetOpen}
	sku={data?.item?.sku}
	error={addVariantError}
	bind:productId={addVariantProductId}
	bind:title={addVariantTitle}
	{productsList}
	submitting={addVariantSubmitting}
	onSubmit={submitAddVariant}
/>

<EditDetailsSheet
	bind:open={editDetailsSheetOpen}
	error={editDetailsError}
	bind:sku={editDetailsSku}
	bind:requiresShipping={editDetailsRequiresShipping}
	saving={editDetailsSaving}
	onSave={saveEditDetails}
/>

<ManageLocationsSheet
	bind:open={manageLocationsSheetOpen}
	detail={data ? { item: { id: data.item.id }, levels: data.levels } : null}
	{displayName}
	{stockLocationsRows}
	stockLocationsPagination={stockLocationsPagination}
	stockLocationsStart={stockLocationsStart}
	stockLocationsEnd={stockLocationsEnd}
	stockLocationsLoading={stockLocationsLoading}
	onStockLocationsPageChange={goToLocationsSheetPage}
	onDetailRefetch={async () => {
		await itemDetailQuery.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={deleteItemModalOpen}
	entityName="inventory item"
	entityTitle={displayName}
	onConfirm={confirmDeleteItem}
	onCancel={closeDeleteItemConfirm}
	submitting={deleteItemSubmitting}
	error={deleteItemError}
/>
