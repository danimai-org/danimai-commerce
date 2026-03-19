<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';

	interface Props {
		providerId?: string | null;
	}

	let { providerId = null }: Props = $props();
</script>

<div class="rounded-lg border bg-card shadow-sm">
	<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
		<h2 class="text-lg font-semibold">Tax Provider</h2>
		<Button size="sm" variant="outline" disabled>Configure</Button>
	</div>
	<div class="px-6 py-6">
		<p class="text-sm text-muted-foreground">Provider ID</p>
		<p class="mt-1 text-sm font-medium">{providerId ?? 'Not set'}</p>
	</div>
</div>
