<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api/pagination.svelte.js';
	import { JSONComponent } from '$lib/components/organs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		CampaignInformationCard,
		CampaignConfigurationCard,
		CampaignTotalUsedCard,
		CampaignBudgetLimitCard,
		CampaignPromotionsCard,
		EditCampaignSheet,
		type CampaignDetail
	} from '$lib/components/organs/campaign/detail/index.js';
	import type { Promotion } from '$lib/components/organs/promotion/types.js';
	import ChevronRight from '@lucide/svelte/icons/chevron-right';
	import Folder from '@lucide/svelte/icons/folder';

	const paginateState = createPagination(
		async () => {
			const id = page.params.id;
			if (!id) throw new Error('Missing campaign ID');
			return client['campaigns']({ id }).get();
		},
		['campaigns', 'detail'],
		createPaginationQuery(page.url.searchParams),
		{ keySuffix: () => [page.params.id ?? ''] }
	);

	const { query } = paginateState;
	const campaign = $derived((query.data as { data?: CampaignDetail } | undefined)?.data ?? null);
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);

	let promotions = $state<Promotion[]>([]);
	let editSheetOpen = $state(false);

	$effect(() => {
		const id = campaign?.id;
		if (!id) {
			promotions = [];
			return;
		}
		void (async () => {
			const res = await client['promotions'].get({ query: { page: 1, limit: 200 } });
			const all = ((res as { data?: { rows?: Promotion[] } })?.data?.rows ?? []) as Promotion[];
			promotions = all.filter((p) => p.campaign_id === id);
		})();
	});

	function formatDateTime(value: string | null) {
		if (!value) return '';
		return new Date(value).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit'
		});
	}

	function getCampaignStatus(c: CampaignDetail): 'scheduled' | 'active' | 'expired' {
		const now = new Date();
		if (c.start_date) {
			const start = new Date(c.start_date);
			if (start > now) return 'scheduled';
		}
		if (c.end_date) {
			const end = new Date(c.end_date);
			if (end < now) return 'expired';
		}
		if (c.start_date && c.end_date) {
			const start = new Date(c.start_date);
			const end = new Date(c.end_date);
			if (start <= now && end >= now) return 'active';
		}
		if (c.start_date) {
			const start = new Date(c.start_date);
			if (start <= now) return 'active';
		}
		return 'active';
	}

	function statusBadgeClass(status: 'scheduled' | 'active' | 'expired'): string {
		const base = 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium';
		switch (status) {
			case 'active':
				return `${base} bg-green-500/10 text-green-700 dark:text-green-400`;
			case 'scheduled':
				return `${base} bg-amber-500/10 text-amber-700 dark:text-amber-400`;
			case 'expired':
				return `${base} bg-muted text-muted-foreground`;
			default:
				return `${base} bg-muted text-muted-foreground`;
		}
	}

	function statusBadgeDot(status: 'scheduled' | 'active' | 'expired'): string {
		switch (status) {
			case 'active':
				return 'size-1.5 rounded-full bg-green-600';
			case 'scheduled':
				return 'size-1.5 rounded-full bg-amber-600';
			case 'expired':
				return 'size-1.5 rounded-full bg-muted-foreground/60';
			default:
				return 'size-1.5 rounded-full bg-muted-foreground/60';
		}
	}

	function openEditSheet() {
		if (!campaign) return;
		editSheetOpen = true;
	}

	function closeToList() {
		goto(resolve('/promotions/campaigns', {}));
	}
</script>

<svelte:head>
	<title>{campaign?.name ?? 'Campaign'} | Campaigns | Danimai Store</title>
	<meta name="description" content="Campaign details." />
</svelte:head>

<div class="flex h-full flex-col bg-background">
	<div class="shrink-0 border-b px-6 py-4">
		<nav class="mb-4 flex items-center gap-[5px] pl-[10px] text-sm">
			<a
				href={resolve('/promotions/campaigns', {})}
				class="flex items-center gap-1.5 text-muted-foreground hover:text-foreground"
			>
				<Folder class="size-4 shrink-0" />
				<span>Campaigns</span>
			</a>
			<ChevronRight class="size-4 shrink-0 text-muted-foreground" />
			<span class="font-medium text-foreground">{campaign?.name ?? '…'}</span>
		</nav>
		<div class="flex items-start justify-between gap-4 pt-1">
			<div class="flex-1">
				<div class="mb-1 text-base font-bold text-muted-foreground">Campaign Information</div>
			</div>
			{#if campaign}
				<span class={statusBadgeClass(getCampaignStatus(campaign))}>
					<span class={statusBadgeDot(getCampaignStatus(campaign))}></span>
					{getCampaignStatus(campaign).charAt(0).toUpperCase() +
						getCampaignStatus(campaign).slice(1)}
				</span>
			{/if}
		</div>
	</div>

	{#if loading && !campaign}
		<div class="flex flex-1 items-center justify-center p-6">
			<span class="animate-pulse text-muted-foreground">Loading campaign…</span>
		</div>
	{:else if error}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 p-6">
			<p class="text-destructive">Error: {error}</p>
			<Button variant="outline" onclick={closeToList}>Back to Campaigns</Button>
		</div>
	{:else if campaign}
		<div class="min-h-0 flex-1 overflow-auto px-6 py-6">
			<div class="mx-auto flex max-w-2xl flex-col gap-6">
				<CampaignInformationCard {campaign} onEdit={openEditSheet} />
				<CampaignConfigurationCard {campaign} {formatDateTime} onEdit={openEditSheet} />
				<CampaignTotalUsedCard />
				<CampaignBudgetLimitCard budgetLimitPer={campaign.budget_limit_per} onEdit={openEditSheet} />
				<CampaignPromotionsCard {promotions} onAdd={closeToList} />
				<JSONComponent product={campaign} options={[]} variants={[]} category={null} />
			</div>
		</div>
	{/if}
</div>

<EditCampaignSheet
	bind:open={editSheetOpen}
	campaign={campaign}
	onSaved={async () => {
		await paginateState.refetch();
	}}
/>
