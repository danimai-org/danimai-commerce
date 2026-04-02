<script lang="ts">
	import Folder from '@lucide/svelte/icons/folder';
	import type { Campaign } from '../types.js';
	import type { PromotionDetail } from './types.js';

	let {
		promotion,
		linkedCampaign
	}: {
		promotion: PromotionDetail;
		linkedCampaign: Campaign | null | undefined;
	} = $props();
</script>

<div class="flex flex-col gap-4">
	<h2 class="text-sm font-semibold">Campaign</h2>
	<div class="rounded-lg border bg-muted/30 p-4">
		{#if promotion.campaign_id}
			{#if linkedCampaign}
				<div class="flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<Folder class="size-4 text-muted-foreground" />
						<span class="text-sm font-medium">{linkedCampaign.name}</span>
					</div>
					<p class="text-sm text-muted-foreground">{linkedCampaign.identifier}</p>
					{#if linkedCampaign.description}
						<p class="text-sm text-muted-foreground">{linkedCampaign.description}</p>
					{/if}
				</div>
			{:else}
				<p class="text-sm text-muted-foreground">
					{promotion.campaign_name ?? 'Campaign not found'}
				</p>
			{/if}
		{:else}
			<p class="text-sm text-muted-foreground">No campaign assigned</p>
		{/if}
	</div>
</div>
