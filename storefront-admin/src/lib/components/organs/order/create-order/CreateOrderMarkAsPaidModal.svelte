<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import {
		orderDialogBody,
		orderDialogFooter,
		orderDialogHeader,
		orderDialogSm,
		orderDialogTitle
	} from '../dialog-classes.js';

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
	<Dialog.Content class={orderDialogSm}>
		<Dialog.Header class={orderDialogHeader}>
			<Dialog.Title class={orderDialogTitle}>Mark as paid</Dialog.Title>
		</Dialog.Header>
		<div class={orderDialogBody}>
			<p class="text-sm text-muted-foreground">
				Mark this order as paid if you received {totalFormatted} from another payment method. This
				will create an order.
			</p>
		</div>
		<Dialog.Footer class={orderDialogFooter}>
			<Button variant="outline" onclick={onCancel} disabled={creatingOrder}>Cancel</Button>
			<Button onclick={onCreate} disabled={creatingOrder || !canCreate}>
				{creatingOrder ? 'Creating...' : 'Create order'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
