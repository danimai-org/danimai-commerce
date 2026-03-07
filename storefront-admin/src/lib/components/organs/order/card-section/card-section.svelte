<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title = '',
		headerAction,
		children,
		class: className = ''
	}: {
		title?: string;
		headerAction?: Snippet;
		children?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="rounded-lg border bg-card p-4 {className}">
	{#if title || headerAction}
		<div class="mb-4 flex items-center justify-between">
			{#if title}
				<h3 class="text-sm font-semibold">{title}</h3>
			{/if}
			{#if headerAction}
				{@render headerAction()}
			{:else if title}
				<div>
					
				</div>
			{/if}
		</div>
	{/if}
	{#if children}
		{@render children()}
	{/if}
</div>
