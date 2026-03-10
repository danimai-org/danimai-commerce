<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Share2 from '@lucide/svelte/icons/share-2';
	import ProductSalesChannelsSheet from './ProductSalesChannelsSheet.svelte';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import Pencil from '@lucide/svelte/icons/pencil';


	const salesChannels = $derived(getProductDetail().data?.sales_channels ?? []);
	let sheetOpen = $state(false);
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
		{#if salesChannels.length > 0}
			{#each salesChannels as channel (channel.id)}
				<div class="flex items-center gap-2 text-sm">
					<Share2 class="size-4 text-muted-foreground" />
					<span>{channel?.name}</span>
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
		Available in {salesChannels.length} of {salesChannels.length} sales channels
	</p>
</div>

<ProductSalesChannelsSheet
	bind:open={sheetOpen}
	onSelectedIdsChange={() => {}}
	onSave={() => {}}
	onCancel={() => {}}
	submitting={false}
/>
