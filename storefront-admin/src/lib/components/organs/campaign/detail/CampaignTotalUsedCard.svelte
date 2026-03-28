<script lang="ts">
	import DollarSign from '@lucide/svelte/icons/dollar-sign';

	let { totalUsed = 0 }: { totalUsed?: number } = $props();
</script>

<div class="rounded-lg border bg-card p-6">
	<div class="mb-4 flex items-center gap-2">
		<DollarSign class="size-4 text-muted-foreground" />
		<h3 class="text-sm font-semibold">Total used</h3>
	</div>
	<p class="text-2xl font-semibold">{totalUsed}</p>
</div>
