<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';

	type Totals = {
		inStock: number;
		reserved: number;
		available: number;
		locationCount: number;
	};

	let {
		displayName,
		sku,
		totals,
		onEditDetails,
		onAddVariant
	}: {
		displayName: string;
		sku: string | null;
		totals: Totals;
		onEditDetails: () => void;
		onAddVariant: () => void;
	} = $props();
</script>

<div class="flex flex-col gap-6 md:flex-row">
	<div class="flex-1 rounded-lg border bg-card p-6 shadow-sm">
		<div class="flex items-center justify-between">
			<h2 class="font-semibold">{displayName} Details</h2>
			<Button
				variant="ghost"
				size="icon"
				class="size-8 shrink-0"
				onclick={onEditDetails}
				aria-label="Edit details"
			>
				<Pencil class="size-4" />
			</Button>
		</div>
		<dl class="mt-4 grid gap-2 text-sm">
			<div>
				<dt class="text-muted-foreground">SKU</dt>
				<dd class="font-medium">{sku ?? '–'}</dd>
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

	<div class="w-full self-start rounded-lg border bg-card p-6 shadow-sm md:w-52">
		<div class="flex flex-col gap-2">
			<div>
				<h2 class="font-semibold">Associated variants</h2>
				<p class="mt-1 text-xs text-muted-foreground">
					Product variants linked to this inventory item by SKU.
				</p>
			</div>
			{#if sku}
				<Button variant="outline" size="sm" onclick={onAddVariant}>
					Add variant
				</Button>
			{:else}
				<p class="text-xs text-muted-foreground">Set SKU in Edit details to link variants.</p>
			{/if}
		</div>
	</div>
</div>
