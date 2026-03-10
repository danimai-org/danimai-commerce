<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Share2 from '@lucide/svelte/icons/share-2';
	import Pencil from '@lucide/svelte/icons/pencil';
	import ProductSalesChannelsSheet from '$lib/components/organs/product-detail/ProductSalesChannelsSheet.svelte';

	type SalesChannel = {
		id: string;
		name: string;
		is_default?: boolean;
	};

	interface Props {
		allSalesChannels: SalesChannel[];
		productSalesChannelIds: Set<string>;
		setProductSalesChannelIds: (set: Set<string>) => void;
		updateProductSalesChannels: (selectedIds: Set<string>) => Promise<void>;
		onSaved: () => void | Promise<void>;
	}

	let {
		allSalesChannels = [],
		productSalesChannelIds = new Set(),
		setProductSalesChannelIds,
		updateProductSalesChannels,
		onSaved
	}: Props = $props();

	let sheetOpen = $state(false);
	let submitting = $state(false);

	async function handleSave() {
		submitting = true;
		try {
			await updateProductSalesChannels(productSalesChannelIds);
			await onSaved();
			sheetOpen = false;
		} catch {
			// error can be shown by parent or sheet
		} finally {
			submitting = false;
		}
	}
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Sales Channels</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={() => (sheetOpen = true)}
			aria-label="Edit sales channels"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	<div class="mt-4 flex flex-col gap-2">
		{#if productSalesChannelIds.size > 0}
			{#each Array.from(productSalesChannelIds)
				.map((id) => allSalesChannels.find((ch: SalesChannel) => ch.id === id))
				.filter((ch): ch is SalesChannel => ch != null) as channel}
				<div class="flex items-center gap-2 text-sm">
					<Share2 class="size-4 text-muted-foreground" />
					<span>{channel.name}</span>
				</div>
			{/each}
		{:else}
			<div class="flex items-center gap-2 text-sm">
				<Share2 class="size-4 text-muted-foreground" />
				<span>No sales channels selected</span>
			</div>
		{/if}
	</div>
	<p class="mt-1 text-xs text-muted-foreground">
		Available in {productSalesChannelIds.size} of {allSalesChannels.length} sales channels
	</p>
</div>

<ProductSalesChannelsSheet
	bind:open={sheetOpen}
	channels={allSalesChannels}
	selectedIds={productSalesChannelIds}
	onSelectedIdsChange={setProductSalesChannelIds}
	onSave={handleSave}
	onCancel={() => (sheetOpen = false)}
	submitting={submitting}
/>
