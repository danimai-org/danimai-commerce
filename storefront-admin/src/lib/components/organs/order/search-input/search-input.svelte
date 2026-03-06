<script lang="ts">
	import { Input } from '$lib/components/ui/input/index.js';
	import Search from '@lucide/svelte/icons/search';

	let {
		value = $bindable(''),
		placeholder = 'Search',
		class: className = ''
	}: {
		value?: string;
		placeholder?: string;
		class?: string;
	} = $props();
</script>

<div class="relative {className}">
	<Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
	<Input
		type="search"
		placeholder={placeholder}
		bind:value
		class="h-9 rounded-md pl-9"
	/>
</div>
