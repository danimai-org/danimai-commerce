<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Share2 from '@lucide/svelte/icons/share-2';
	import ProductSalesChannelsSheet from './ProductSalesChannelsSheet.svelte';
	import { getDetailContext } from '$lib/hooks';
	import Pencil from '@lucide/svelte/icons/pencil';
	import { SvelteSet } from 'svelte/reactivity';
	import { client } from '$lib/client.js';
	import { createQuery } from '@tanstack/svelte-query';
	import type { Product } from '../type';

	const detailQuery = getDetailContext<Product>();
	const product = $derived(detailQuery?.data ?? null);

	const salesChannels = $derived(
		(product as { sales_channels?: Array<{ id: string; name: string }> } | null)?.sales_channels ??
			[]
	);
	const salesChannelsTotalQuery = createQuery(() => ({
		queryKey: ['sales-channels', 'product-detail-total'],
		queryFn: async () => {
			const res = await client['sales-channels'].get({
				query: {
					page: '1',
					limit: '1',
					sorting_field: 'sales_channels.created_at'
				}
			});
			const payload = res?.data as { pagination?: { total?: number } } | undefined;
			return payload?.pagination?.total ?? 0;
		},
		refetchOnWindowFocus: false
	}));
	let selectedIds = new SvelteSet<string>();
	let sheetOpen = $state(false);
	let submitting = $state(false);
	let saveError = $state<string | null>(null);

	$effect(() => {
		if (!sheetOpen) return;
		selectedIds.clear();
		for (const channel of salesChannels ?? []) {
			selectedIds.add((channel as { id: string }).id);
		}
		saveError = null;
	});

	function handleCancel() {
		sheetOpen = false;
		saveError = null;
	}

	async function handleSave() {
		const productId = (product as { id?: string } | null)?.id;
		if (!productId) return;

		submitting = true;
		saveError = null;
		try {
			const res = await client.products({ id: productId }).put({
				sales_channel_ids: Array.from(selectedIds)
			});

			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				saveError = err.value?.message ?? 'Failed to update sales channels';
				return;
			}

			sheetOpen = false;
			await detailQuery?.refetch?.();
		} catch (e) {
			saveError = e instanceof Error ? e.message : String(e);
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
		Available in {salesChannels.length} of {salesChannelsTotalQuery.data ?? salesChannels.length} sales channels
	</p>
	{#if saveError}
		<p class="mt-2 text-xs text-destructive">{saveError}</p>
	{/if}
</div>

<ProductSalesChannelsSheet
	bind:open={sheetOpen}
	{selectedIds}
	onSelectedIdsChange={(set) => {
		selectedIds.clear();
		for (const id of set) {
			selectedIds.add(id);
		}
	}}
	onSave={handleSave}
	onCancel={handleCancel}
	{submitting}
/>
