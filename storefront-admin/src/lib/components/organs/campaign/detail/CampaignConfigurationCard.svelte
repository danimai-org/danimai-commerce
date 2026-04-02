<script lang="ts">
	import type { CampaignDetail } from './types.js';
	import CampaignCardActionsMenu from './CampaignCardActionsMenu.svelte';

	let {
		campaign,
		formatDateTime,
		onEdit
	}: {
		campaign: CampaignDetail;
		formatDateTime: (value: string | null) => string;
		onEdit: () => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-6">
	<div class="mb-4 flex items-start justify-between">
		<h3 class="text-sm font-semibold">Configuration</h3>
		<CampaignCardActionsMenu {onEdit} />
	</div>
	<div class="grid grid-cols-2 gap-4">
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<div class="h-6 w-1 rounded bg-amber-600"></div>
				<div class="text-xs font-medium text-muted-foreground">Start date</div>
			</div>
			<p class="pl-3 text-sm">
				{#if campaign.start_date}
					{formatDateTime(campaign.start_date)}
				{:else}
					<span class="text-muted-foreground">-</span>
				{/if}
			</p>
		</div>
		<div class="flex flex-col gap-2">
			<div class="flex items-center gap-2">
				<div class="h-6 w-1 rounded bg-amber-600"></div>
				<div class="text-xs font-medium text-muted-foreground">End date</div>
			</div>
			<p class="pl-3 text-sm">
				{#if campaign.end_date}
					{formatDateTime(campaign.end_date)}
				{:else}
					<span class="text-muted-foreground">-</span>
				{/if}
			</p>
		</div>
	</div>
</div>
