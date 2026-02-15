<script lang="ts">
	import { Select as SelectPrimitive } from 'bits-ui';

	let { type = 'single', ...restProps }: SelectPrimitive.RootProps = $props();
</script>

<SelectPrimitive.Root {type} {...restProps} />
