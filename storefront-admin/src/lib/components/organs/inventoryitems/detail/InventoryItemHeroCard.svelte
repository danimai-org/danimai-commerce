<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/components/ui/button/index.js';
	import { getDetailContext } from '$lib/hooks';
	import type { InventoryItemDetailData } from '../type.js';
	import EditInventoryHero from '$lib/components/organs/inventoryitems/update/EditInventoryHero.svelte';
	import AddVariantSheet from '$lib/components/organs/inventoryitems/detail/AddVariantSheet.svelte';
	import { client } from '$lib/client.js';

	let formSheetOpen = $state(false);
	let variantSheetOpen = $state(false);
	let addVariantProductId = $state('');
	let addVariantTitle = $state('');
	let addVariantSubmitting = $state(false);
	let productsList = $state<{ id: string; title: string }[]>([]);
	let addVariantError = $state<string | null>(null);
	const detailQuery = getDetailContext<InventoryItemDetailData>();
	const detail = $derived(detailQuery?.data ?? null);

	const displayName = $derived(
		detail?.item?.sku ??
			detail?.item?.id?.slice(0, 8) ??
			detailQuery?.data?.item?.sku ??
			detailQuery?.data?.item?.id?.slice(0, 8) ??
			'Inventory Item'
	);

	function openEditHero() {
		if (!detail?.item) return;
		formSheetOpen = true;
	}

	async function loadProductsForVariantSheet() {
		try {
			const res = await client.products.get({
				query: { page: 1, limit: 200 }
			});
			const rows = ((res?.data as { rows?: { id: string; title: string }[] } | undefined)?.rows ?? []).filter(
				(row): row is { id: string; title: string } =>
					typeof row?.id === 'string' && typeof row?.title === 'string'
			);
			productsList = rows;
		} catch {
			productsList = [];
		}
	}

	async function openAddVariantSheet() {
		if (!detail?.item?.sku) return;
		addVariantError = null;
		addVariantProductId = '';
		addVariantTitle = '';
		if (productsList.length === 0) {
			await loadProductsForVariantSheet();
		}
		variantSheetOpen = true;
	}

	const totals = $derived.by(() => {
		if (!detail?.levels?.length) {
			return { inStock: 0, reserved: 0, available: 0, locationCount: 0 };
		}
		const inStock = detail.levels.reduce((s, l) => s + l.stocked_quantity, 0);
		const reserved = detail.levels.reduce((s, l) => s + l.reserved_quantity, 0);
		const available = detail.levels.reduce((s, l) => s + l.available_quantity, 0);
		return {
			inStock,
			reserved,
			available,
			locationCount: detail.levels.length
		};
	});
</script>

<div class="flex min-h-0 flex-col overflow-auto">
	<div class="flex flex-col gap-6 p-6">
		<div class="rounded-lg border bg-card p-8 shadow-sm">
			<div class="flex items-start justify-between gap-4">
				<div class="min-w-0 flex-1 space-y-6">
					<h1 class="text-3xl font-semibold tracking-tight">{displayName}</h1>
					<div class="grid gap-4 text-sm sm:grid-cols-[110px_minmax(0,1fr)] sm:items-start">
						<span class="pt-0.5 font-medium text-muted-foreground">SKU</span>
						<p class="text-foreground">{detail?.item?.sku ?? '–'}</p>
						<span class="pt-0.5 font-medium text-muted-foreground">In stock</span>
						<p class="text-foreground">
							{totals.inStock} across {totals.locationCount} location{totals.locationCount === 1
								? ''
								: 's'}
						</p>
						<span class="pt-0.5 font-medium text-muted-foreground">Reserved</span>
						<p class="text-foreground">
							{totals.reserved} across {totals.locationCount} location{totals.locationCount === 1
								? ''
								: 's'}
						</p>
						<span class="pt-0.5 font-medium text-muted-foreground">Available</span>
						<p class="text-foreground">
							{totals.available} across {totals.locationCount} location{totals.locationCount === 1
								? ''
								: 's'}
						</p>
					</div>
					<div class="border-t pt-6">
						<h2 class="font-semibold">Associated variants</h2>
						<p class="mt-1 text-xs text-muted-foreground">
							Product variants linked to this inventory item by SKU.
						</p>
						{#if detail?.item?.sku}
							<Button
								variant="outline"
								size="sm"
								class="mt-3"
								onclick={openAddVariantSheet}>Add variant</Button
							>
						{:else}
							<p class="mt-3 text-xs text-muted-foreground">
								Set SKU in Edit details to link variants.
							</p>
						{/if}
					</div>
				</div>
				<div class="flex flex-col items-end gap-3">
					<Button
						variant="ghost"
						size="icon"
						class="size-8 shrink-0"
						onclick={openEditHero}
						aria-label="Edit inventory item details"
					>
						<Pencil class="size-4" />
					</Button>
					<span
						class={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${detail?.item?.requires_shipping ? 'bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}
					>
						{detail?.item?.requires_shipping ? 'Requires shipping' : 'No shipping'}
					</span>
				</div>
			</div>
		</div>
	</div>
</div>

<EditInventoryHero
	bind:open={formSheetOpen}
	item={detail?.item ?? null}
	onSuccess={() => {
		void detailQuery?.refetch?.();
	}}
/>

<AddVariantSheet
	bind:open={variantSheetOpen}
	sku={detail?.item?.sku}
	error={addVariantError}
	bind:productId={addVariantProductId}
	bind:title={addVariantTitle}
	{productsList}
	submitting={addVariantSubmitting}
	onSubmit={async () => {
		addVariantError =
			'Variant creation from inventory detail is not implemented yet. Create/edit the variant in Product detail and set the same SKU to link it.';
		void detailQuery?.refetch?.();
	}}
/>
