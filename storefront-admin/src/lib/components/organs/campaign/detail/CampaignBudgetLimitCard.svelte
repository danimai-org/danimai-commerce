<script lang="ts">
	import Clock from '@lucide/svelte/icons/clock';
	import CampaignCardActionsMenu from './CampaignCardActionsMenu.svelte';

	let {
		budgetLimitPer,
		onEdit
	}: {
		budgetLimitPer: number | null | undefined;
		onEdit: () => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-6">
	<div class="flex items-start justify-between">
		<div class="flex-1">
			<div class="mb-4 flex items-center gap-2">
				<Clock class="size-4 text-muted-foreground" />
				<h3 class="text-sm font-semibold">Budget limit per customer</h3>
			</div>
			<p class="text-2xl font-semibold">
				{budgetLimitPer != null ? budgetLimitPer : '—'}
			</p>
		</div>
		<CampaignCardActionsMenu {onEdit} />
	</div>
</div>
