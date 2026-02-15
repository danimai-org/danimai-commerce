<script lang="ts">
	import { Select } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: Select.ContentProps & { class?: string } = $props();

	const contentClass = cn(
		'z-50 min-w-[8rem] overflow-hidden rounded-md border border-input bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
		className
	);
</script>

<Select.Content {...restProps}>
	{#snippet child({ props, wrapperProps })}
		<div {...wrapperProps}>
			<div {...props} class={cn(contentClass, props.class)}>
				{@render children?.()}
			</div>
		</div>
	{/snippet}
</Select.Content>
