<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';

	export let attributes: Array<{ id: string; title: string; value?: string }> = [];
	export let onOpenEditAttributesSheet: () => void;
</script>

<div class="rounded-lg border border-gray-300 bg-card p-6 shadow-sm">
	<div class="flex items-center justify-between">
		<h2 class="font-semibold">Attributes</h2>
		<Button
			variant="ghost"
			size="icon"
			class="size-8 shrink-0"
			onclick={onOpenEditAttributesSheet}
			aria-label="Edit attributes"
		>
			<Pencil class="size-4" />
		</Button>
	</div>
	<dl class="mt-4 space-y-3 text-sm">
		{#if attributes.length > 0}
			{#each attributes as attr (attr.id)}
				<div>
					<dt class="font-medium text-muted-foreground">{attr.title}</dt>
					<dd class="break-words text-foreground">{attr.value ?? '—'}</dd>
				</div>
			{/each}
		{:else}
			<div>
				<dt class="font-medium text-muted-foreground">No attributes</dt>
				<dd>—</dd>
			</div>
		{/if}
	</dl>
</div>

