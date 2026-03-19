<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import CreateOverrideSheet from './CreateOverrideSheet.svelte';

	interface Props {
		regionId?: string;
	}

	let { regionId }: Props = $props();

	let sheetOpen = $state(false);
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="text-lg font-semibold">Tax Overrides</h2>
		<Button size="sm" variant="outline" onclick={() => (sheetOpen = true)}>Create</Button>
	</div>
	<div class="px-6 py-10 text-center">
		<p class="text-sm font-medium text-muted-foreground">No records</p>
		<p class="mt-1 text-sm text-muted-foreground">There are no records to show</p>
	</div>
</div>

<CreateOverrideSheet bind:open={sheetOpen} {regionId} />
