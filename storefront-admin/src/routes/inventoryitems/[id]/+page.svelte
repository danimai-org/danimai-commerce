<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import {
		InventoryItemHeroCard,
		LocationListCard,
		ReservationsCard
	} from '$lib/components/organs/inventoryitems/detail/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import type {
		InventoryItemDetailData,
		InventoryItemEntity,
		InventoryLevelWithLocation,
		ReservationItemEntity
	} from '$lib/components/organs/inventoryitems/type.js';
	import { type TableColumn } from '$lib/components/organs/index.js';
	import {
		createPagination,
		createPaginationQuery,
		type PaginationMeta
	} from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Package from '@lucide/svelte/icons/package';
	import { Button } from '$lib/components/ui/button/index.js';
	import { createQuery } from '@tanstack/svelte-query';
	import { setDetailContext } from '$lib/hooks';
	import { SvelteMap, SvelteURLSearchParams } from 'svelte/reactivity';

	const itemId = $derived(page.params?.id ?? '');

	type RetrieveInventoryItemApiBody = Omit<
		InventoryItemDetailData,
		'item' | 'levels' | 'reservations'
	> &
		InventoryItemEntity & {
			inventory_levels: InventoryLevelWithLocation[];
			reservation_items: ReservationItemEntity[];
		};

	function mapRetrieveBodyToDetailData(raw: unknown): InventoryItemDetailData | null {
		if (raw == null || typeof raw !== 'object') return null;
		const o = raw as Record<string, unknown>;
		if ('item' in o && o.item != null && typeof o.item === 'object') {
			return raw as InventoryItemDetailData;
		}
		const {
			inventory_levels,
			reservation_items,
			associated_variants,
			product_summaries,
			...itemRest
		} = raw as RetrieveInventoryItemApiBody;
		return {
			item: itemRest as InventoryItemEntity,
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

	const detailQuery = createQuery(() => ({
		queryKey: ['inventory-item-detail', itemId],
		queryFn: async (): Promise<InventoryItemDetailData | null> => {
			if (!itemId) return null;
			const res = await client.inventory.items({ id: itemId }).get();
			if (res?.error) {
				throw new Error(
					String(res?.error?.value?.message ?? 'Failed to get inventory item detail')
				);
			}
			return mapRetrieveBodyToDetailData(res?.data);
		},
		refetchOnWindowFocus: false
	}));

	const stockLocationsNameMapQuery = createQuery(() => ({
		queryKey: ['stock-locations-name-map'],
		queryFn: async () => {
			const res = await client['stock-locations'].get({
				query: { limit: 500 } as Record<string, unknown>
			});
			if (res?.error) {
				throw new Error(String(res?.error?.value?.message ?? 'Failed to load stock locations'));
			}
			return ((res?.data as { rows?: { id: string; name: string | null }[] } | undefined)?.rows ??
				[]) as { id: string; name: string | null }[];
		},
		enabled: () => !!itemId,
		refetchOnWindowFocus: false
	}));

	const locationNameById = $derived.by(() => {
		const rows = stockLocationsNameMapQuery.data ?? [];
		const m = new SvelteMap<string, string>();
		for (const loc of rows) {
			const n = loc.name?.trim();
			if (n) m.set(loc.id, n);
		}
		return m;
	});

	setDetailContext(detailQuery);

	const data = $derived(detailQuery?.data ?? null);
	const isPending = $derived(detailQuery?.isPending);
	const error = $derived(
		detailQuery?.error != null
			? detailQuery.error instanceof Error
				? detailQuery.error.message
				: String(detailQuery.error)
			: data === null && detailQuery?.isSuccess && itemId
				? 'Inventory item not found'
				: null
	);

	const displayName = $derived(
		data?.item?.sku ?? data?.item?.id?.slice(0, 8) ?? (itemId ? itemId.slice(0, 8) : '…')
	);

	const levelsPage = $derived(
		Math.max(1, parseInt(page.url.searchParams.get('levels_page') ?? '1', 10) || 1)
	);
	const levelsLimit = $derived(
		Math.max(
			1,
			Math.min(100, parseInt(page.url.searchParams.get('levels_limit') ?? '10', 10) || 10)
		)
	);
	const variantsPage = $derived(
		Math.max(1, parseInt(page.url.searchParams.get('variants_page') ?? '1', 10) || 1)
	);
	const variantsLimit = $derived(
		Math.max(
			1,
			Math.min(100, parseInt(page.url.searchParams.get('variants_limit') ?? '10', 10) || 10)
		)
	);

	const levelsTotal = $derived(data?.levels?.length ?? 0);
	const levelsPaginationMeta = $derived(clientPaginationMeta(levelsTotal, levelsPage, levelsLimit));
	const levelsOffset = $derived((levelsPaginationMeta.page - 1) * levelsLimit);

	const levelsStart = $derived(levelsTotal === 0 ? 0 : levelsOffset + 1);
	const levelsEnd = $derived(Math.min(levelsOffset + levelsLimit, levelsTotal));

	function goToLevelsPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('levels_page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const variantsTotal = $derived((data?.associated_variants ?? []).length);
	const variantsPaginationMeta = $derived(
		clientPaginationMeta(variantsTotal, variantsPage, variantsLimit)
	);
	const variantsOffset = $derived((variantsPaginationMeta.page - 1) * variantsLimit);

	const variantsStart = $derived(variantsTotal === 0 ? 0 : variantsOffset + 1);
	const variantsEnd = $derived(Math.min(variantsOffset + variantsLimit, variantsTotal));

	const locationsSheetPage = $derived(
		Math.max(1, parseInt(page.url.searchParams.get('locations_sheet_page') ?? '1', 10) || 1)
	);
	const locationsSheetLimit = $derived(
		Math.max(
			1,
			Math.min(100, parseInt(page.url.searchParams.get('locations_sheet_limit') ?? '10', 10) || 10)
		)
	);

	let manageLocationsSheetOpen = $state(false);
	function openManageLocationsSheet() {
		manageLocationsSheetOpen = true;
	}

	let levelDeleteOpen = $state(false);
	let levelToDelete = $state<Record<string, unknown> | null>(null);
	let levelDeleteSubmitting = $state(false);
	let levelDeleteError = $state<string | null>(null);

	const levelDeleteTitle = $derived(
		String(levelToDelete?.location_name ?? levelToDelete?.location_id ?? levelToDelete?.id ?? '')
	);

	function requestDeleteLevel(row: Record<string, unknown>) {
		levelToDelete = row;
		levelDeleteError = null;
		levelDeleteOpen = true;
	}

	async function confirmDeleteLevel() {
		const row = levelToDelete;
		const rawId = row?.id;
		const id = typeof rawId === 'string' ? rawId : rawId != null ? String(rawId) : '';
		if (!id) return;
		levelDeleteSubmitting = true;
		levelDeleteError = null;
		try {
			const res = await client.inventory.levels({ id }).delete();
			if (res?.error) {
				const err = res.error as { value?: { message?: string } };
				levelDeleteError = String(err.value?.message ?? 'Failed to delete inventory level');
				return;
			}
			levelDeleteOpen = false;
			levelToDelete = null;
			await detailQuery.refetch();
		} catch (e) {
			levelDeleteError = e instanceof Error ? e.message : String(e);
		} finally {
			levelDeleteSubmitting = false;
		}
	}

	const stockLocationsPaginateState = createPagination(
		async () =>
			client['stock-locations'].get({
				query: createPaginationQuery(
					new SvelteURLSearchParams({
						page: String(locationsSheetPage),
						limit: String(locationsSheetLimit)
					})
				)
			}),
		['stock-locations-picker'],
		undefined,
		{
			enabled: () => manageLocationsSheetOpen,
			keySuffix: () => [itemId, locationsSheetPage, locationsSheetLimit]
		}
	);

	const stockLocationsQuery = $derived(stockLocationsPaginateState.query);
	const stockLocationsRows = $derived(
		(stockLocationsQuery.data?.data?.rows ?? []) as { id: string; name: string | null }[]
	);
	const stockLocationsPagination = $derived(stockLocationsQuery.data?.data?.pagination ?? null);
	const stockLocationsLoading = $derived(stockLocationsPaginateState.loading);
	const stockLocationsStart = $derived(stockLocationsPaginateState.start);
	const stockLocationsEnd = $derived(stockLocationsPaginateState.end);

	function goToLocationsSheetPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('locations_sheet_page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const variantsRows = $derived(
		(data?.associated_variants ?? [])
			.slice(variantsOffset, variantsOffset + variantsLimit)
			.map((variant) => ({
				...variant,
				product_title:
					(variant.product_id ? data?.product_summaries?.[variant.product_id]?.title : null) ?? '—'
			})) as Record<string, unknown>[]
	);
	const levelsRows = $derived(
		(data?.levels ?? []).slice(levelsOffset, levelsOffset + levelsLimit).map((l) => {
			const embedded = l.location?.name?.trim();
			const listed = locationNameById.get(l.location_id);
			return {
				...l,
				location_name: embedded ?? listed ?? l.location_id
			};
		}) as Record<string, unknown>[]
	);

	function goToVariantsPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('variants_page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const variantsColumns: TableColumn[] = [
		{ label: 'Title', key: 'title', type: 'text' },
		{ label: 'SKU', key: 'sku', type: 'text' },
		{ label: 'Product', key: 'product_title', type: 'text' },
		{ label: 'Product ID', key: 'product_id', type: 'text' }
	];

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
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => requestDeleteLevel(item as Record<string, unknown>)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>{displayName} | Inventory | Danimai Store</title>
	<meta name="description" content="Manage inventory item." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/inventoryitems', {}), { replaceState: true })}
			>
				<Package class="size-4 shrink-0" />
				<span>Inventory</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{displayName}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !data}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Inventory item not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/inventoryitems', {}), { replaceState: true })}
				>Back to Inventory</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<InventoryItemHeroCard />

			<div class="flex flex-col gap-8 p-6">
				<LocationListCard
					title="Associated variants"
					columns={variantsColumns}
					rows={variantsRows}
					emptyMessage="No associated variants."
					pagination={variantsPaginationMeta}
					start={variantsStart}
					end={variantsEnd}
					onPageChange={goToVariantsPage}
				/>
				<LocationListCard
					title="Locations"
					columns={levelsColumns}
					rows={levelsRows}
					emptyMessage="No locations."
					pagination={levelsPaginationMeta}
					start={levelsStart}
					end={levelsEnd}
					onPageChange={goToLevelsPage}
					actionLabel="Manage locations"
					onActionClick={openManageLocationsSheet}
					showManageLocationsSheet
					bind:manageLocationsSheetOpen
					manageLocationsDetail={data ? { item: data.item, levels: data.levels } : null}
					{displayName}
					{stockLocationsRows}
					{stockLocationsPagination}
					{stockLocationsStart}
					{stockLocationsEnd}
					{stockLocationsLoading}
					onStockLocationsPageChange={goToLocationsSheetPage}
					onDetailRefetch={async () => {
						await detailQuery.refetch();
					}}
					stockLocationNameById={locationNameById}
				/>

				<ReservationsCard
					inventoryItemId={data.item.id}
					inventoryItemLabel={data.item.sku ?? data.item.id.slice(0, 8)}
					levels={data.levels}
					stockLocationNameById={locationNameById}
					variantTitle={data.associated_variants?.[0]?.title ?? null}
					variantSku={data.associated_variants?.[0]?.sku ?? null}
					itemSku={data.item.sku}
					reservations={data.reservations}
					onReservationCreated={async () => {
						await detailQuery.refetch();
					}}
				/>
			</div>
		</div>
	{/if}
</div>

<DeleteConfirmationModal
	bind:open={levelDeleteOpen}
	entityName="inventory level"
	entityTitle={levelDeleteTitle}
	customMessage="Remove this inventory level? Stock at this location will no longer be tracked for this item."
	onConfirm={confirmDeleteLevel}
	onCancel={() => {
		levelToDelete = null;
		levelDeleteError = null;
	}}
	submitting={levelDeleteSubmitting}
	error={levelDeleteError}
/>
