<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Share2 from '@lucide/svelte/icons/share-2';
	import ProductSalesChannelsSheet from './ProductSalesChannelsSheet.svelte';
	import { getProductDetail } from '$lib/hooks/use-product-detail.svelte.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { SvelteSet } from 'svelte/reactivity';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';


	const salesChannels = $derived(getProductDetail().data?.sales_channels ?? []);
	const salesChannelsQuery = createQuery(() => ({
		queryKey: ['sales-channels', 'product-detail-sheet'],
		queryFn: async () =>
			client['sales-channels'].get({
				query: {
					page: '1',
					limit: '100',
					sorting_field: 'created_at'
				}
			}),
		refetchOnWindowFocus: false
	}));
	const allSalesChannels = $derived.by(() => {
		const payload = salesChannelsQuery.data?.data as { rows?: unknown[]; data?: unknown[] } | undefined;
		const rows = (payload?.rows ?? payload?.data ?? []) as {
			id: string;
			name?: string;
			title?: string;
			is_default?: boolean;
		}[];
		return rows.map((channel) => ({
			id: channel.id,
			name: channel.name ?? '',
			title: channel.title,
			is_default: channel.is_default
		}));
	});
	let selectedIds = $state(new SvelteSet<string>());
	let sheetOpen = $state(false);

	$effect(() => {
		selectedIds = new SvelteSet((salesChannels ?? []).map((channel: { id: string }) => channel.id));
	});
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
		Available in {salesChannels.length} of {allSalesChannels.length || salesChannels.length} sales channels
	</p>
</div>

<ProductSalesChannelsSheet
	bind:open={sheetOpen}
	channels={allSalesChannels.length ? allSalesChannels : salesChannels}
	selectedIds={selectedIds}
	onSelectedIdsChange={(set) => (selectedIds = set)}
	onSave={() => {}}
	onCancel={() => {}}
	submitting={false}
/>
