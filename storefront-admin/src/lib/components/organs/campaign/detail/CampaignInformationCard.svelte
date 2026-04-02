<script lang="ts">
	import type { CampaignDetail } from './types.js';
	import CampaignCardActionsMenu from './CampaignCardActionsMenu.svelte';

	let {
		campaign,
		onEdit
	}: {
		campaign: CampaignDetail;
		onEdit: () => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-6">
	<div class="mb-4 flex items-start justify-between">
		<h3 class="text-sm font-semibold">Information</h3>
		<CampaignCardActionsMenu {onEdit} />
	</div>
	<div class="flex flex-col gap-4">
		<div class="flex flex-col gap-1">
			<div class="text-xs font-medium text-muted-foreground">Name</div>
			<p class="text-sm font-medium">{campaign.name}</p>
		</div>
		<div class="flex flex-col gap-1">
			<div class="text-xs font-medium text-muted-foreground">Identifier</div>
			<p class="text-sm font-medium">{campaign.identifier}</p>
		</div>
		<div class="flex flex-col gap-1">
			<div class="text-xs font-medium text-muted-foreground">Description</div>
			{#if campaign.description}
				<p class="text-sm">{campaign.description}</p>
			{:else}
				<p class="text-sm text-muted-foreground">—</p>
			{/if}
		</div>
	</div>
</div>
