<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';

	let {
		value = $bindable(''),
		symbol,
		placeholder = '0',
		class: className = 'h-8 pl-6'
	}: {
		value?: string;
		symbol: string;
		placeholder?: string;
		class?: string;
	} = $props();
</script>

<div class="relative w-20">
	<span class="absolute top-1/2 left-2 -translate-y-1/2 text-xs text-muted-foreground">
		{symbol}
	</span>
	<Input bind:value type="text" {placeholder} class={className} />
</div>
