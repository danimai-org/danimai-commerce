<script lang="ts">
	import { Select } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: Select.GroupHeadingProps & { class?: string } = $props();
</script>

<Select.GroupHeading {...restProps} class={cn('px-2 py-1.5 text-sm font-semibold', className)}>
	{#snippet children()}
		{@render children?.()}
	{/snippet}
</Select.GroupHeading>
