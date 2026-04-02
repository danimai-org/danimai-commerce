<script lang="ts">
	import Pencil from '@lucide/svelte/icons/pencil';
	import { Button } from '$lib/components/ui/button/index.js';
	import { client } from '$lib/client.js';
	import { getDetailContext } from '$lib/hooks';
	import type { InventoryItemDetailData } from '../type.js';
	import EditInventoryHero from '$lib/components/organs/inventoryitems/update/EditInventoryHero.svelte';
	import AddVariantSheet from '$lib/components/organs/inventoryitems/detail/AddVariantSheet.svelte';

	let formSheetOpen = $state(false);
	let editSku = $state('');
	let editRequiresShipping = $state(true);
	let editHeroError = $state<string | null>(null);
	let editHeroSaving = $state(false);
	let variantSheetOpen = $state(false);
	let addVariantProductId = $state('');
	let addVariantTitle = $state('');
	let addVariantSubmitting = $state(false);
	let productsList = $state<{ id: string; title: string }[]>([]);
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
		editSku = detail.item.sku ?? '';
		editRequiresShipping = detail.item.requires_shipping ?? true;
		editHeroError = null;
		formSheetOpen = true;
	}

	async function saveEditHero() {
		const id = detail?.item?.id;
		if (!id) return;
		editHeroError = null;
		editHeroSaving = true;
		try {
			const trimmed = editSku.trim();
			const res = await client.inventory.items({ id }).put({
				sku: trimmed === '' ? null : trimmed,
				requires_shipping: editRequiresShipping
			});
			if (res?.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(String(err.value?.message ?? 'Failed to update inventory item'));
			}
			formSheetOpen = false;
			void detailQuery?.refetch?.();
		} catch (e) {
			editHeroError = e instanceof Error ? e.message : String(e);
		} finally {
			editHeroSaving = false;
		}
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
								onclick={() => (variantSheetOpen = true)}>Add variant</Button
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
	bind:sku={editSku}
	bind:requiresShipping={editRequiresShipping}
	error={editHeroError}
	saving={editHeroSaving}
	onSave={saveEditHero}
/>

<AddVariantSheet
	bind:open={variantSheetOpen}
	sku={detail?.item?.sku}
	error={null}
	bind:productId={addVariantProductId}
	bind:title={addVariantTitle}
	{productsList}
	submitting={addVariantSubmitting}
	onSubmit={() => {
		void detailQuery?.refetch?.();
	}}
/>
