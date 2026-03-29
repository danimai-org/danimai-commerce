<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Share2 from '@lucide/svelte/icons/share-2';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import ProductListingCard from '$lib/components/organs/product/detail/ProductListingCard.svelte';
	import { JSONComponent, MetadataComponent } from '$lib/components/organs/index.js';
	import EditSaleChannel from '$lib/components/organs/sales-channel/update/EditSaleChannel.svelte';
	import SalesChannelHeroCard from '$lib/components/organs/sales-channel/detail/SalesChannelHeroCard.svelte';
	import { resolve } from '$app/paths';
	import { setDetailContext, useDetailQuery } from '$lib/hooks';

	const channelId = $derived(page.params?.id ?? '');
	let formSheetOpen = $state(false);

	function openEdit() {
		formSheetOpen = true;
	}

	const detailQuery = useDetailQuery(async () => {
		const res = await client['sales-channels']({ id: channelId }).get();
		return res.data;
	}, ['sales-channel-detail', channelId]);

	setDetailContext(detailQuery);

	const channel = $derived(detailQuery?.data ?? null);
	const error = $derived(detailQuery?.error);
	const isPending = $derived(detailQuery?.isPending);
</script>

<svelte:head>
	<title>{channel?.name ?? channelId ?? 'Sales Channel'} | Sales Channels | Danimai Store</title>
	<meta name="description" content="Manage sales channel details." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto(resolve('/sales-channels', {}), { replaceState: true })}
			>
				<Share2 class="size-4 shrink-0" />
				<span>Sales Channels</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{channel?.name ?? channelId ?? '…'}</span>
		</nav>
	</div>

	{#if isPending}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !channel}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Sales channel not found'}</p>
			<Button
				variant="outline"
				onclick={() => goto(resolve('/sales-channels', {}), { replaceState: true })}
				>Back to Sales Channels</Button
			>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<SalesChannelHeroCard onEdit={openEdit} />

			<div class="flex flex-col gap-8 p-6">
				<ProductListingCard
					filter={{ sales_channel_id: channel.id }}
					title="Products Sales Channel"
				/>

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={channel.id}
						metadataEntity="sales-channel"
						metadata={(channel.metadata ?? {}) as Record<string, unknown>}
						onSaved={() => {
							detailQuery?.refetch();
						}}
					/>
					<JSONComponent product={channel} options={[]} variants={[]} category={null} />
				</div>
			</div>
		</div>
	{/if}
</div>

<EditSaleChannel
	bind:open={formSheetOpen}
	mode="edit"
	{channel}
	onSuccess={() => detailQuery.refetch()}
/>
