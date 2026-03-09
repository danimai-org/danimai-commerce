<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Lock from '@lucide/svelte/icons/lock';
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Shipping configuration</h2>
		<Button variant="outline" size="sm" disabled>Edit</Button>
	</div>
	<div
		class="mt-4 flex w-full items-center gap-3 rounded-md border p-3 text-left text-sm"
	>
		<Lock class="size-4 text-muted-foreground" />
		<div>
			<p class="font-medium">Default Shipping Profile</p>
			<p class="text-xs text-muted-foreground">default</p>
		</div>
	</div>
</div>

