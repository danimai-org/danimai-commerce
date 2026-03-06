<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		title = '',
		icon,
		action,
		class: className = ''
	}: {
		title?: string;
		icon?: Snippet;
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10 {className}">
	<div class="flex items-center gap-2">
		{#if icon}
			{@render icon()}
		{/if}
		<span class="font-semibold">{title}</span>
	</div>
	{#if action}
		{@render action()}
	{/if}
</div>
