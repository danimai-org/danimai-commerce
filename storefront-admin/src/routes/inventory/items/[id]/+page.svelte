<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Package from '@lucide/svelte/icons/package';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/modal/index.js';
	import { DropdownMenu } from 'bits-ui';

	const API_BASE = 'http://localhost:8000';

	const itemId = $derived($page.params.id);

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

	let data = $state<DetailData | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let manageLocationsSheetOpen = $state(false);
	let stockLocations = $state<StockLocation[]>([]);
	let addLocationId = $state('');
	let addStockedQty = $state('0');
	let addReservedQty = $state('0');
	let addAvailableQty = $state('0');
	let levelsSaving = $state(false);
	let levelsError = $state<string | null>(null);
	// Editable quantities per level id (for inline edit)
	let levelStockEdit = $state<Record<string, string>>({});
	let levelReservedEdit = $state<Record<string, string>>({});
	let levelAvailableEdit = $state<Record<string, string>>({});
	let deleteLevelModalOpen = $state(false);
	let levelToDelete = $state<InventoryLevel | null>(null);
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
			locationCount: data.levels.length,
		};
	});

	const associatedVariants = $derived(data?.associated_variants ?? []);
	const productTitles = $derived(
		Object.fromEntries(
			Object.entries(data?.product_summaries ?? {}).map(([id, s]) => [
				id,
				s.title ?? '–',
			])
		)
	);
	const productThumbnails = $derived(
		Object.fromEntries(
			Object.entries(data?.product_summaries ?? {})
				.filter(([, s]) => s.thumbnail)
				.map(([id, s]) => [id, s.thumbnail!])
		)
	);

	async function loadItem() {
		if (!itemId) return;
		loading = true;
		error = null;
		try {
			const res = await fetch(`${API_BASE}/inventory/items/${itemId}`, {
				cache: 'no-store',
			});
			if (!res.ok) {
				if (res.status === 404) {
					error = 'Inventory item not found';
					return;
				}
				throw new Error(await res.text());
			}
			data = (await res.json()) as DetailData;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			data = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		itemId;
		loadItem();
	});

	function openAddVariantSheet() {
		addVariantSheetOpen = true;
		addVariantError = null;
		addVariantProductId = '';
		addVariantTitle = '';
		(async () => {
			try {
				const res = await fetch(`${API_BASE}/products?limit=100`, { cache: 'no-store' });
				if (res.ok) {
					const j = (await res.json()) as { products?: { id: string; title: string }[] };
					productsList = j.products ?? [];
				} else {
					productsList = [];
				}
			} catch {
				productsList = [];
			}
		})();
	}

	async function submitAddVariant() {
		if (!data?.item?.sku || !addVariantProductId || !addVariantTitle.trim()) return;
		addVariantError = null;
		addVariantSubmitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-variants`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: addVariantProductId,
					title: addVariantTitle.trim(),
					sku: data.item.sku
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			addVariantSheetOpen = false;
			await loadItem();
		} catch (e) {
			addVariantError = e instanceof Error ? e.message : String(e);
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
			const res = await fetch(`${API_BASE}/inventory/items/${data.item.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					sku: editDetailsSku.trim() || null,
					requires_shipping: editDetailsRequiresShipping
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			editDetailsSheetOpen = false;
			await loadItem();
		} catch (e) {
			editDetailsError = e instanceof Error ? e.message : String(e);
		} finally {
			editDetailsSaving = false;
		}
	}

	async function openManageLocationsSheet() {
		manageLocationsSheetOpen = true;
		levelsError = null;
		addLocationId = '';
		addStockedQty = '0';
		addReservedQty = '0';
		addAvailableQty = '0';
		levelStockEdit = {};
		if (data?.levels) {
			levelStockEdit = Object.fromEntries(
				data.levels.map((l) => [l.id, String(l.stocked_quantity)])
			);
			levelReservedEdit = Object.fromEntries(
				data.levels.map((l) => [l.id, String(l.reserved_quantity)])
			);
			levelAvailableEdit = Object.fromEntries(
				data.levels.map((l) => [l.id, String(l.available_quantity)])
			);
		}
		try {
			const res = await fetch(`${API_BASE}/stock-locations?limit=100`, {
				cache: 'no-store'
			});
			if (res.ok) {
				const j = (await res.json()) as { data?: StockLocation[] };
				stockLocations = j.data ?? [];
			}
		} catch {
			stockLocations = [];
		}
	}

	const existingLocationIds = $derived(
		new Set((data?.levels ?? []).map((l) => l.location_id))
	);
	const locationsToAdd = $derived(
		stockLocations.filter((loc) => !existingLocationIds.has(loc.id))
	);
	const locationNameById = $derived(
		Object.fromEntries(stockLocations.map((loc) => [loc.id, loc.name ?? loc.id]))
	);

	async function addLevel() {
		if (!data?.item?.id || !addLocationId) return;
		levelsError = null;
		levelsSaving = true;
		try {
			const stocked = Math.max(0, parseInt(addStockedQty, 10) || 0);
			const reserved = Math.max(0, parseInt(addReservedQty, 10) || 0);
			const res = await fetch(`${API_BASE}/inventory/levels`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					inventory_item_id: data.item.id,
					location_id: addLocationId,
					stocked_quantity: stocked,
					reserved_quantity: reserved
				})
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			addLocationId = '';
			addStockedQty = '0';
			addReservedQty = '0';
			addAvailableQty = '0';
			await loadItem();
			if (data?.levels) {
				levelStockEdit = Object.fromEntries(
					data.levels.map((l) => [l.id, String(l.stocked_quantity)])
				);
				levelReservedEdit = Object.fromEntries(
					data.levels.map((l) => [l.id, String(l.reserved_quantity)])
				);
				levelAvailableEdit = Object.fromEntries(
					data.levels.map((l) => [l.id, String(l.available_quantity)])
				);
			}
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
		} finally {
			levelsSaving = false;
		}
	}

	async function saveAllLevels() {
		if (!data?.item?.id || !data?.levels?.length) return;
		levelsError = null;
		levelsSaving = true;
		try {
			for (const level of data.levels) {
				const stocked = Math.max(0, parseInt(levelStockEdit[level.id] ?? '', 10) || 0);
				const reserved = Math.max(0, parseInt(levelReservedEdit[level.id] ?? '', 10) || 0);
				const res = await fetch(`${API_BASE}/inventory/levels`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						inventory_item_id: data.item.id,
						location_id: level.location_id,
						stocked_quantity: stocked,
						reserved_quantity: reserved
					})
				});
				if (!res.ok) {
					const text = await res.text();
					throw new Error(text || `HTTP ${res.status}`);
				}
			}
			await loadItem();
			if (data?.levels) {
				levelStockEdit = Object.fromEntries(
					data.levels.map((l) => [l.id, String(l.stocked_quantity)])
				);
				levelReservedEdit = Object.fromEntries(
					data.levels.map((l) => [l.id, String(l.reserved_quantity)])
				);
				levelAvailableEdit = Object.fromEntries(
					data.levels.map((l) => [l.id, String(l.available_quantity)])
				);
			}
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
		} finally {
			levelsSaving = false;
		}
	}

	async function deleteLevel(level: InventoryLevel) {
		levelsError = null;
		levelsSaving = true;
		try {
			const res = await fetch(`${API_BASE}/inventory/levels/${level.id}`, {
				method: 'DELETE'
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			await loadItem();
			levelStockEdit = Object.fromEntries(
				(data?.levels ?? []).map((l) => [l.id, String(l.stocked_quantity)])
			);
			levelReservedEdit = Object.fromEntries(
				(data?.levels ?? []).map((l) => [l.id, String(l.reserved_quantity)])
			);
			levelAvailableEdit = Object.fromEntries(
				(data?.levels ?? []).map((l) => [l.id, String(l.available_quantity)])
			);
		} catch (e) {
			levelsError = e instanceof Error ? e.message : String(e);
		} finally {
			levelsSaving = false;
		}
	}

	function openDeleteItemConfirm() {
		deleteItemModalOpen = true;
		deleteItemError = null;
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
			const res = await fetch(`${API_BASE}/inventory/items/${data.item.id}`, {
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
				deleteItemError = message;
				return;
			}
			deleteItemModalOpen = false;
			goto('/inventory/items');
		} catch (e) {
			deleteItemError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteItemSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Inventory &gt; {displayName}</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<!-- Breadcrumbs -->
		<div class="mb-4 flex flex-wrap items-center gap-x-2 gap-y-1 border-b pb-4 text-sm text-muted-foreground">
			<a href="/inventory/items" class="hover:text-foreground">Inventory</a>
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
					<div class="flex gap-6">
						<!-- Details card -->
						<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
							<div class="flex items-center justify-between">
								<h2 class="font-semibold">{displayName} Details</h2>
								<Button
									variant="ghost"
									size="icon"
									class="size-8 shrink-0"
									onclick={openEditDetailsSheet}
									aria-label="Edit details"
								>
									<Pencil class="size-4" />
								</Button>
							</div>
							<dl class="mt-4 grid gap-2 text-sm">
								<div>
									<dt class="text-muted-foreground">SKU</dt>
									<dd class="font-medium">{data.item.sku ?? '–'}</dd>
								</div>
								<div>
									<dt class="text-muted-foreground">In stock</dt>
									<dd class="font-medium">
										{totals.inStock} across {totals.locationCount} location{totals.locationCount === 1 ? '' : 's'}
									</dd>
								</div>
								<div>
									<dt class="text-muted-foreground">Reserved</dt>
									<dd class="font-medium">
										{totals.reserved} across {totals.locationCount} location{totals.locationCount === 1 ? '' : 's'}
									</dd>
								</div>
								<div>
									<dt class="text-muted-foreground">Available</dt>
									<dd class="font-medium">
										{totals.available} across {totals.locationCount} location{totals.locationCount === 1 ? '' : 's'}
									</dd>
								</div>
							</dl>
						</div>

						<!-- Associated variants -->
						<div class="rounded-lg border bg-card p-6 shadow-sm self-start w-52">
							<div class="flex flex-col gap-2">
								<div>
									<h2 class="font-semibold">Associated variants</h2>
									<p class="mt-1 text-xs text-muted-foreground">Product variants linked to this inventory item by SKU.</p>
								</div>
								{#if data.item.sku}
									<Button variant="outline" size="sm" onclick={openAddVariantSheet}>
										Add variant
									</Button>
								{:else}
									<p class="text-xs text-muted-foreground">Set SKU in Edit details to link variants.</p>
								{/if}
							</div>
							{#if associatedVariants.length === 0}
								<p class="mt-4 text-sm text-muted-foreground">No associated variants.</p>
							{:else}
								<ul class="mt-4 space-y-2">
									{#each associatedVariants as v (v.id)}
										<li>
											<a
												href="/products/{v.product_id}"
												class="flex items-center gap-3 rounded-md border p-3 text-left text-sm hover:bg-muted/50"
											>
												{#if v.thumbnail || (v.product_id && productThumbnails[v.product_id])}
													<img
														src={v.thumbnail || (v.product_id ? productThumbnails[v.product_id] : '')}
														alt=""
														class="size-12 shrink-0 rounded-md border border-input object-cover"
													/>
												{:else}
													<Package class="size-8 shrink-0 text-muted-foreground" />
												{/if}
												<div class="min-w-0 flex-1">
													<p class="font-medium">{v.product_id ? productTitles[v.product_id] ?? '…' : '–'}</p>
													<p class="text-xs text-muted-foreground">{v.title}</p>
													<p class="mt-0.5 text-xs text-muted-foreground">SKU {v.sku ?? '–'}</p>
												</div>
												<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
											</a>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					</div>

					<!-- Locations card - Full width -->
					<div class="rounded-lg border bg-card p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<h2 class="font-semibold">Locations</h2>
						<Button variant="outline" size="sm" onclick={openManageLocationsSheet}>Manage locations</Button>
					</div>
					<div class="mt-4 overflow-auto rounded-lg border">
						<table class="w-full text-sm">
							<thead class="border-b bg-muted/50">
								<tr>
									<th class="px-3 py-2 text-left font-medium">Location</th>
									<th class="px-3 py-2 text-left font-medium">Reserved</th>
									<th class="px-3 py-2 text-left font-medium">In stock</th>
									<th class="px-3 py-2 text-left font-medium">Available</th>
									<th class="w-10 px-3 py-2"></th>
								</tr>
							</thead>
							<tbody>
								{#if data.levels.length === 0}
									<tr>
										<td colspan="5" class="px-3 py-8 text-center text-muted-foreground">
											No locations.
										</td>
									</tr>
								{:else}
									{#each data.levels as level (level.id)}
										<tr class="border-b last:border-0">
											<td class="px-3 py-2 text-xs">{level.location?.name ?? level.location_id}</td>
											<td class="px-3 py-2">{level.reserved_quantity}</td>
											<td class="px-3 py-2">{level.stocked_quantity}</td>
											<td class="px-3 py-2">{level.available_quantity}</td>
											<td class="px-3 py-2">
												<Button
													variant="ghost"
													size="icon"
													class="size-8 text-muted-foreground hover:text-foreground"
													onclick={openManageLocationsSheet}
													aria-label="Edit locations"
												>
													<Pencil class="size-4" />
												</Button>
											</td>
										</tr>
									{/each}
								{/if}
							</tbody>
						</table>
					</div>
					{#if data.levels.length > 0}
						<div class="mt-2 flex items-center justify-between gap-4 border-t py-2 text-xs text-muted-foreground">
							<span>1 – {data.levels.length} of {data.levels.length} results</span>
							<span>1 of 1 pages</span>
						</div>
					{/if}
					</div>

					<!-- Reservations card - Full width -->
					<div class="rounded-lg border bg-card p-6 shadow-sm">
					<div class="flex items-center justify-between">
						<h2 class="font-semibold">Reservations</h2>
						<Button variant="outline" size="sm">Create</Button>
					</div>
					<div class="mt-4 py-8 text-center text-sm text-muted-foreground">
						No reservations.
					</div>
					</div>
			</div>
		{/if}
	</div>
</div>

<!-- Manage locations sheet -->
<Sheet.Root bind:open={manageLocationsSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-lg sm:max-w-lg">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Manage locations</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					{data ? `${displayName} – stock levels by location` : ''}
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if data}
					{#if levelsError}
						<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
							{levelsError}
						</div>
					{/if}
					<!-- Create: Add stock at a location -->
					<div class="mb-6 flex flex-col gap-3 rounded-lg border p-4">
						<p class="text-sm font-medium">Create – Add stock at a location</p>
						<div class="flex flex-wrap items-end gap-3">
							<div class="min-w-0 space-y-1.5">
								<label for="add-location" class="text-xs text-muted-foreground">Location</label>
								<select
									id="add-location"
									bind:value={addLocationId}
									class="flex h-9 w-full min-w-[140px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
								>
									<option value="">Select location…</option>
									{#each locationsToAdd as loc (loc.id)}
										<option value={loc.id}>{loc.name ?? loc.id}</option>
									{/each}
								</select>
							</div>
							<div class="min-w-0 space-y-1.5">
								<label for="add-reserved" class="text-xs text-muted-foreground">Reserved</label>
								<Input
									id="add-reserved"
									type="number"
									min="0"
									class="h-9 w-20"
									value={addReservedQty}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										addReservedQty = v;
										addAvailableQty = String(Math.max(0, (parseInt(addStockedQty, 10) || 0) - (parseInt(v, 10) || 0)));
									}}
								/>
							</div>
							<div class="min-w-0 space-y-1.5">
								<label for="add-qty" class="text-xs text-muted-foreground">In stock</label>
								<Input
									id="add-qty"
									type="number"
									min="0"
									class="h-9 w-20"
									value={addStockedQty}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										addStockedQty = v;
										addAvailableQty = String(Math.max(0, (parseInt(v, 10) || 0) - (parseInt(addReservedQty, 10) || 0)));
									}}
								/>
							</div>
							<div class="min-w-0 space-y-1.5">
								<label for="add-available" class="text-xs text-muted-foreground">Available</label>
								<Input
									id="add-available"
									type="number"
									min="0"
									class="h-9 w-20"
									value={addAvailableQty}
									oninput={(e) => {
										const v = (e.currentTarget as HTMLInputElement).value;
										addAvailableQty = v;
										addStockedQty = String((parseInt(v, 10) || 0) + (parseInt(addReservedQty, 10) || 0));
									}}
								/>
							</div>
							<Button
								size="sm"
								disabled={!addLocationId || levelsSaving}
								onclick={addLevel}
							>
								{levelsSaving ? 'Adding…' : 'Add'}
							</Button>
						</div>
						{#if locationsToAdd.length === 0 && stockLocations.length > 0}
							<p class="text-xs text-muted-foreground">All locations already have stock for this item.</p>
						{/if}
					</div>
					<!-- Existing levels (editable) -->
					{#if data.levels.length === 0}
						<p class="text-sm text-muted-foreground">No locations yet. Add stock at a location above.</p>
					{:else}
						<div class="overflow-auto rounded-lg border">
							<table class="w-full text-sm">
								<thead class="border-b bg-muted/50">
									<tr>
										<th class="px-3 py-2 text-left font-medium">Location</th>
										<th class="px-3 py-2 text-left font-medium">Reserved</th>
										<th class="px-3 py-2 text-left font-medium">In stock</th>
										<th class="px-3 py-2 text-left font-medium">Available</th>
										<th class="w-10 px-3 py-2"></th>
									</tr>
								</thead>
								<tbody>
									{#each data.levels as level (level.id)}
										<tr class="border-b last:border-0">
											<td class="px-3 py-2 text-xs">{level.location?.name ?? level.location_id}</td>
											<td class="px-3 py-2">
												<Input
													type="number"
													min="0"
													class="h-8 w-16"
													value={levelReservedEdit[level.id] ?? level.reserved_quantity}
													oninput={(e) => {
														const v = (e.currentTarget as HTMLInputElement).value;
														const sid = level.id;
														const stock = parseInt(levelStockEdit[sid] ?? String(level.stocked_quantity), 10) || 0;
														levelReservedEdit = { ...levelReservedEdit, [sid]: v };
														levelAvailableEdit = { ...levelAvailableEdit, [sid]: String(Math.max(0, stock - (parseInt(v, 10) || 0))) };
													}}
												/>
											</td>
											<td class="px-3 py-2">
												<Input
													type="number"
													min="0"
													class="h-8 w-16"
													value={levelStockEdit[level.id] ?? level.stocked_quantity}
													oninput={(e) => {
														const v = (e.currentTarget as HTMLInputElement).value;
														const sid = level.id;
														const res = parseInt(levelReservedEdit[sid] ?? String(level.reserved_quantity), 10) || 0;
														levelStockEdit = { ...levelStockEdit, [sid]: v };
														levelAvailableEdit = { ...levelAvailableEdit, [sid]: String(Math.max(0, (parseInt(v, 10) || 0) - res)) };
													}}
												/>
											</td>
											<td class="px-3 py-2">
												<Input
													type="number"
													min="0"
													class="h-8 w-16"
													value={levelAvailableEdit[level.id] ?? String(level.available_quantity)}
													oninput={(e) => {
														const v = (e.currentTarget as HTMLInputElement).value;
														const sid = level.id;
														const res = parseInt(levelReservedEdit[sid] ?? String(level.reserved_quantity), 10) || 0;
														levelAvailableEdit = { ...levelAvailableEdit, [sid]: v };
														levelStockEdit = { ...levelStockEdit, [sid]: String((parseInt(v, 10) || 0) + res) };
													}}
												/>
											</td>
											<td class="px-3 py-2">
												<DropdownMenu.Root>
													<DropdownMenu.Trigger
														class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
														disabled={levelsSaving}
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
																onSelect={() => {
																	levelToDelete = level;
																	deleteLevelModalOpen = true;
																}}
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
								</tbody>
							</table>
						</div>
					{/if}
				{/if}
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (manageLocationsSheetOpen = false)}>Close</Button>
				<Button
					disabled={levelsSaving || !data?.levels?.length}
					onclick={saveAllLevels}
				>
					{levelsSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Add associated variant sheet -->
<Sheet.Root bind:open={addVariantSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Create associated variant</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					Create a new product variant linked to this inventory item (SKU: {data?.item?.sku ?? '–'}).
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if addVariantError}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{addVariantError}
					</div>
				{/if}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="add-variant-product" class="text-sm font-medium">Product</label>
						<select
							id="add-variant-product"
							bind:value={addVariantProductId}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select product…</option>
							{#each productsList as prod (prod.id)}
								<option value={prod.id}>{prod.title}</option>
							{/each}
						</select>
					</div>
					<div class="flex flex-col gap-2">
						<label for="add-variant-title" class="text-sm font-medium">Variant title</label>
						<Input
							id="add-variant-title"
							bind:value={addVariantTitle}
							placeholder="e.g. Small / Red"
							class="h-9"
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (addVariantSheetOpen = false)} disabled={addVariantSubmitting}>
					Cancel
				</Button>
				<Button
					onclick={submitAddVariant}
					disabled={addVariantSubmitting || !addVariantProductId || !addVariantTitle.trim()}
				>
					{addVariantSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit details sheet -->
<Sheet.Root bind:open={editDetailsSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
				<Sheet.Title>Edit details</Sheet.Title>
				<Sheet.Description class="text-sm text-muted-foreground">
					Update SKU and shipping settings for this inventory item.
				</Sheet.Description>
			</Sheet.Header>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if editDetailsError}
					<div class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
						{editDetailsError}
					</div>
				{/if}
				<div class="flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-details-sku" class="text-sm font-medium">SKU</label>
						<Input
							id="edit-details-sku"
							bind:value={editDetailsSku}
							placeholder="e.g. SKU-001"
							class="h-9"
						/>
						<p class="text-xs text-muted-foreground">Optional. Leave blank for non-shippable items.</p>
					</div>
					<div class="flex items-center gap-2">
						<input
							type="checkbox"
							id="edit-details-requires-shipping"
							bind:checked={editDetailsRequiresShipping}
							class="h-4 w-4 rounded border-input"
						/>
						<label for="edit-details-requires-shipping" class="text-sm font-medium">Requires shipping</label>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (editDetailsSheetOpen = false)} disabled={editDetailsSaving}>
					Cancel
				</Button>
				<Button onclick={saveEditDetails} disabled={editDetailsSaving}>
					{editDetailsSaving ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Delete level confirmation -->
<DeleteConfirmationModal
	bind:open={deleteLevelModalOpen}
	entityName="location stock"
	entityTitle={(() => {
		const currentLevel = levelToDelete;
		if (!currentLevel) return '';
		const level = data?.levels.find(l => l.id === currentLevel.id);
		return level?.location?.name ?? currentLevel.location_id;
	})()}
	customMessage="Remove this inventory level? Stock at this location will no longer be tracked for this item."
	onConfirm={async () => {
		if (levelToDelete) {
			await deleteLevel(levelToDelete);
			deleteLevelModalOpen = false;
			levelToDelete = null;
		}
	}}
	onCancel={() => {
		deleteLevelModalOpen = false;
		levelToDelete = null;
	}}
	submitting={levelsSaving}
/>

<!-- Delete item confirmation -->
<DeleteConfirmationModal
	bind:open={deleteItemModalOpen}
	entityName="inventory item"
	entityTitle={displayName}
	onConfirm={confirmDeleteItem}
	onCancel={closeDeleteItemConfirm}
	submitting={deleteItemSubmitting}
	error={deleteItemError}
/>
