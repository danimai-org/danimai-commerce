<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import type { Promotion } from '$lib/components/organs/promotion/types.js';

	let {
		promotions,
		onAdd
	}: {
		promotions: Promotion[];
		onAdd: () => void;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-6">
	<div class="mb-4 flex items-start justify-between">
		<h3 class="text-sm font-semibold">Promotions</h3>
		<Button size="sm" onclick={onAdd}>Add</Button>
	</div>
	{#if promotions.length === 0}
		<p class="text-sm text-muted-foreground">No promotions associated with this campaign.</p>
	{:else}
		<div class="flex flex-col gap-2">
			{#each promotions as promotion (promotion.id)}
				<div class="flex items-center justify-between rounded-md border p-3">
					<div class="flex flex-col gap-1">
						<span class="text-sm font-medium">{promotion.code || 'Automatic'}</span>
						<span class="text-xs text-muted-foreground">{promotion.method} • {promotion.status}</span>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
