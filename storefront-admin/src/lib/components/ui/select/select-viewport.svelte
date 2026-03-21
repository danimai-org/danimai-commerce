<script lang="ts">
	import { Select } from 'bits-ui';
	import { cn } from '$lib/utils.js';

	let {
		class: className,
		children,
		...restProps
	}: Select.ViewportProps & { class?: string } = $props();
</script>

<Select.Viewport {...restProps} class={cn(className)}>
	{@render children?.()}
</Select.Viewport>
