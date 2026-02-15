<script lang="ts">
	import { Select } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: Select.ItemProps & { class?: string } = $props();

	const itemClass = cn(
		'relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground',
		className
	);
</script>

<Select.Item {...restProps}>
	{#snippet child({ props, selected, highlighted })}
		<div {...props} class={cn(itemClass, props.class)}>
			<span class="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
				{#if selected}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="size-4"
					>
						<title>Selected</title>
						<polyline points="20 6 9 17 4 12" />
					</svg>
				{/if}
			</span>
			{@render children?.({ selected, highlighted })}
		</div>
	{/snippet}
</Select.Item>
