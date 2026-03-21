<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Share2 from '@lucide/svelte/icons/share-2';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import ProductListingCard from '$lib/components/organs/product/detail/ProductListingCard.svelte';
	import { JSONComponent, MetadataComponent } from '$lib/components/organs/index.js';

	import EditSaleChannel from '$lib/components/organs/sales-channel/update/EditSaleChannel.svelte';
	import SalesChannelHeroCard from '$lib/components/organs/sales-channel/detail/SalesChannelHeroCard.svelte';

	const channelId = $derived(page.params?.id ?? '');

	let channel = $state<any | null>(null);
	let loading = $state(true);
	let error = $state<string | null>(null);
	let formSheetOpen = $state(false);
	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);
	let deleteError = $state<string | null>(null);
	let selectedIds = $state<Set<string>>(new Set());


	const channelHandle = $derived.by(() => {
		const source = channel?.name?.trim() ?? '';
		if (!source) return `/${channel?.id ?? ''}`;
		return `/${source
			.toLowerCase()
			.replace(/[^a-z0-9\s-]/g, '')
			.replace(/\s+/g, '-')
			.replace(/-+/g, '-')}`;
	});

	async function loadChannel() {
		if (!channelId) return;
		loading = true;
		error = null;
		try {
			const res = await client['sales-channels']({ id: channelId }).get();
			if (res.error) {
				const err = res.error as { status?: number; value?: { message?: string } };
				if (err?.status === 404) {
					error = 'Sales channel not found';
					channel = null;
					return;
				}
				error = err?.value?.message ?? String(res.error);
				channel = null;
				return;
			}
			channel = (res.data ?? null) as any | null;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
			channel = null;
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		channelId;
		loadChannel();
	});

	function openEdit() {
		formSheetOpen = true;
	}

	function openDelete() {
		deleteError = null;
		deleteConfirmOpen = true;
	}

	async function confirmDelete() {
		if (!channel) return;
		deleteSubmitting = true;
		deleteError = null;
		try {
			await client['sales-channels'].delete({ sales_channel_ids: [channel.id] });
			deleteConfirmOpen = false;
			goto('/sales-channels');
		} catch (e) {
			deleteError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{channel?.name ?? channelId ?? 'Sales Channel'} | Sales Channels | Danimai Store</title>
	<meta name="description" content="Manage sales channel details." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex shrink-0 items-center justify-between gap-4 border-b px-6 py-3">
		<nav class="flex items-center gap-[5px] pl-[10px] text-sm">
			<button
				type="button"
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
				onclick={() => goto('/sales-channels')}
			>
				<Share2 class="size-4 shrink-0" />
				<span>Sales Channels</span>
			</button>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
			<span class="font-medium text-foreground">{channel?.name ?? channelId ?? '…'}</span>
		</nav>
	</div>

	{#if loading}
		<div class="flex flex-1 items-center justify-center p-6">
			<p class="text-muted-foreground">Loading…</p>
		</div>
	{:else if error || !channel}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">{error ?? 'Sales channel not found'}</p>
			<Button variant="outline" onclick={() => goto('/sales-channels')}>Back to Sales Channels</Button>
		</div>
	{:else}
		<div class="flex min-h-0 flex-1 flex-col overflow-auto">
			<SalesChannelHeroCard {channel} {channelHandle} onEdit={openEdit} onSaved={loadChannel} />

			<div class="flex flex-col gap-8 p-6">
				<ProductListingCard filter={{ sales_channel_id: channel.id }} title="Products Sales Channel" />

				<div class="grid gap-4 sm:grid-cols-2">
					<MetadataComponent
						productId={channel.id}
						metadataEntity="sales-channel"
						metadata={(channel.metadata ?? {}) as Record<string, unknown>}
						onSaved={loadChannel}
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
	onSuccess={loadChannel}
/>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="sales channel"
	entityTitle={channel?.name ?? channel?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={() => {
		deleteConfirmOpen = false;
	}}
	submitting={deleteSubmitting}
	error={deleteError}
/>
