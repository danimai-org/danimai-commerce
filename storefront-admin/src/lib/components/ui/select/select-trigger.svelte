<script lang="ts">
	import { Select } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: Select.TriggerProps & { class?: string } = $props();

	const triggerClass = cn(
		'flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring',
		className
	);
</script>

<Select.Trigger {...restProps}>
	{#snippet child({ props })}
		<button {...props} class={cn(triggerClass, props.class)}>
			{@render children?.()}
		</button>
	{/snippet}
</Select.Trigger>
