<script lang="ts">
	import { cn } from '$lib/utils.js';

	let {
		value = $bindable(''),
		symbol,
		placeholder = '0',
		class: className = 'h-8'
	}: {
		value?: string;
		symbol: string;
		placeholder?: string;
		class?: string;
	} = $props();
</script>

<div
	class={cn(
		'border-input bg-background ring-offset-background flex w-24 min-w-24 items-center gap-1 rounded-md border px-2 shadow-xs focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]',
		className
	)}
>
	<span class="shrink-0 text-xs text-muted-foreground">{symbol}</span>
	<input
		type="text"
		bind:value
		{placeholder}
		class="min-w-0 flex-1 border-0 bg-transparent p-0 text-base outline-none placeholder:text-muted-foreground md:text-sm"
	/>
</div>
