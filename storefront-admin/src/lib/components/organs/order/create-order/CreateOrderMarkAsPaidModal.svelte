<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

	let {
		open = $bindable(false),
		totalFormatted,
		creatingOrder,
		canCreate,
		onCreate,
		onCancel
	}: {
		open?: boolean;
		totalFormatted: string;
		creatingOrder: boolean;
		canCreate: boolean;
		onCreate: () => void;
		onCancel: () => void;
	} = $props();
</script>

<Dialog.Root bind:open>
	<Dialog.Content
		class="top-1/2 left-1/2 flex h-auto max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border p-0 shadow-lg"
	>
		<Dialog.Header class="border-b px-6 py-4">
			<Dialog.Title class="text-base font-semibold">Mark as paid</Dialog.Title>
		</Dialog.Header>
		<div class="px-6 py-4">
			<p class="text-sm text-muted-foreground">
				Mark this order as paid if you received {totalFormatted} from another payment method. This
				will create an order.
			</p>
		</div>
		<Dialog.Footer class="!flex-row justify-end gap-2 border-t px-6 py-4">
			<Button variant="outline" onclick={onCancel} disabled={creatingOrder}>Cancel</Button>
			<Button onclick={onCreate} disabled={creatingOrder || !canCreate}>
				{creatingOrder ? 'Creating...' : 'Create order'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
