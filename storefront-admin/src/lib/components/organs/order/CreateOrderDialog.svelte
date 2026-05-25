<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import CreateOrderContent from './create-order/CreateOrderContent.svelte';

	let {
		open = $bindable(false),
		apiBase = 'http://localhost:8000/admin',
		onSuccess
	}: {
		open?: boolean;
		apiBase?: string;
		onSuccess?: (orderId: string) => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="h-full w-full">
		<CreateOrderContent
			active={open}
			{apiBase}
			{onSuccess}
			onClose={() => (open = false)}
		/>
	</Dialog.Content>
</Dialog.Root>
