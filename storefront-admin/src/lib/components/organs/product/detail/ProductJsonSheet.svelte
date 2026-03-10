<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	export let open: boolean;
	export let productJsonForView: Record<string, unknown> | null;
	export let jsonKeysCount: number;
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">JSON {jsonKeysCount} keys</h2>
			</div>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if productJsonForView}
					<pre
						class="rounded-md border bg-zinc-900 p-4 font-mono text-sm break-all whitespace-pre-wrap text-zinc-300"><code
							>{JSON.stringify(productJsonForView, null, 2)}</code
						></pre>
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
