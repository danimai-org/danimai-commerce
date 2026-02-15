<script lang="ts">
	import { Select } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: Select.GroupProps & { class?: string } = $props();
</script>

<Select.Group {...restProps} class={cn('p-1', className)}>
	{#snippet children()}
		{@render children?.()}
	{/snippet}
</Select.Group>
