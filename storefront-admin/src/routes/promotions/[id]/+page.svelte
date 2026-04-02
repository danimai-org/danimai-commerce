<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { EditPromotionSheet } from '$lib/components/organs/index.js';
	import {
		PromotionOverviewCard,
		PromotionConfigurationCard,
		PromotionConditionsCard,
		PromotionCampaignCard,
		PromotionUsageCard,
		type PromotionDetail
	} from '$lib/components/organs/promotion/detail/index.js';
	import type { Campaign, Promotion } from '$lib/components/organs/promotion/types.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Folder from '@lucide/svelte/icons/folder';
	import { cn } from '$lib/utils.js';

	const paginateState = createPagination(
		async () => {
			const id = page.params.id;
			if (!id) throw new Error('Missing promotion ID');
			return client['promotions']({ id }).get();
		},
		['promotions', 'detail'],
		createPaginationQuery(page.url.searchParams),
		{ keySuffix: () => [page.params.id ?? ''] }
	);

	const { query } = paginateState;
	const promotion = $derived((query.data as { data?: PromotionDetail } | undefined)?.data ?? null);
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);

	let campaigns = $state<Campaign[]>([]);

	$effect(() => {
		void (async () => {
			const res = await client['campaigns'].get({ query: { page: 1, limit: 100 } });
			campaigns = ((res as { data?: { rows?: Campaign[] } })?.data?.rows ?? []) as Campaign[];
		})();
	});

	let editOpen = $state(false);

	function openEditSheet() {
		editOpen = true;
	}

	function goToListEdit() {
		if (!promotion) return;
		goto(resolve(`/promotions?edit=${promotion.id}`, {}));
	}

	async function handleEditSave(updated: Pick<Promotion, 'id' | 'code' | 'method' | 'status'>) {
		await client['promotions']({ id: updated.id }).put({
			code: updated.code,
			method: updated.method,
			status: updated.status
		});
		await paginateState.refetch();
	}

	function closeToList() {
		goto(resolve('/promotions', {}));
	}

	const linkedCampaign = $derived(
		promotion?.campaign_id ? campaigns.find((c) => c.id === promotion.campaign_id) : null
	);
</script>

<svelte:head>
	<title>{promotion?.code ?? 'Promotion'} | Promotions | Danimai Store</title>
	<meta name="description" content="Promotion details." />
</svelte:head>

<div class="flex h-full flex-col bg-background">
	<div class="shrink-0 border-b px-6 py-4">
		<nav class="mb-4 flex items-center gap-[5px] pl-[10px] text-sm">
			<a
				href={resolve('/promotions', {})}
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
			>
				<Folder class="size-4 shrink-0" />
				<span>Promotions</span>
			</a>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
			<span class="font-medium text-foreground">{promotion?.code ?? '…'}</span>
		</nav>
		<div class="flex items-start justify-between gap-4">
			<div>
				<h1 class="text-lg font-semibold">Promotion Details</h1>
				<p class="text-sm text-muted-foreground">View promotion information.</p>
			</div>
			{#if promotion}
				<span
					class={cn(
						'inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium capitalize',
						promotion.status === 'Active' &&
							'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400',
						promotion.status === 'Inactive' && 'bg-muted text-muted-foreground',
						promotion.status === 'Draft' &&
							'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
					)}
				>
					{#if promotion.status === 'Active'}
						<span class="size-1.5 shrink-0 rounded-full bg-green-500" aria-hidden="true"></span>
					{:else if promotion.status === 'Draft'}
						<span class="size-1.5 shrink-0 rounded-full bg-amber-500" aria-hidden="true"></span>
					{:else}
						<span class="size-1.5 shrink-0 rounded-full bg-muted-foreground" aria-hidden="true"
						></span>
					{/if}
					{promotion.status}
				</span>
			{/if}
		</div>
	</div>

	{#if loading && !promotion}
		<div class="flex flex-1 items-center justify-center p-6">
			<span class="animate-pulse text-muted-foreground">Loading promotion…</span>
		</div>
	{:else if error}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">Error: {error}</p>
			<Button variant="outline" onclick={closeToList}>Back to Promotions</Button>
		</div>
	{:else if promotion}
		<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
			<div class="mx-auto flex max-w-2xl flex-col gap-8">
				<PromotionOverviewCard {promotion} onOpenEdit={openEditSheet} />
				<PromotionConfigurationCard />
				<PromotionConditionsCard />
				<PromotionCampaignCard {promotion} {linkedCampaign} />
				<PromotionUsageCard />
			</div>
		</div>

		<div class="flex shrink-0 justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={closeToList}>Close</Button>
			<Button onclick={goToListEdit}>Edit</Button>
		</div>

		<EditPromotionSheet bind:open={editOpen} promotion={promotion} onSave={handleEditSave} />
	{/if}
</div>
