<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';

	export let open: boolean;
	export let productJsonForView: Record<string, unknown> | null;
	export let jsonKeysCount: number;
	export let highlightedJson: string;

</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-2xl sm:max-w-2xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">JSON {jsonKeysCount} keys</h2>
			</div>
			<div class="min-h-0 flex-1 overflow-auto p-6">
				{#if productJsonForView}
				<div class="mt-4 rounded-md bg-[#0d1117] p-4 overflow-hidden">
					<pre class="overflow-x-auto text-sm">
						<code class="hljs">{@html highlightedJson}</code>
					</pre>
				</div>
					
				{:else}
					<p class="text-sm text-muted-foreground">No data</p>
				{/if}
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>
