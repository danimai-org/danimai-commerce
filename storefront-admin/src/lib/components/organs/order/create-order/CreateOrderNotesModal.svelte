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
		notes = $bindable('')
	}: {
		open?: boolean;
		notes?: string;
	} = $props();

	function close() {
		open = false;
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class={orderDialogSm}>
		<Dialog.Header class={orderDialogHeader}>
			<Dialog.Title class={orderDialogTitle}>Edit Notes</Dialog.Title>
		</Dialog.Header>
		<div class={orderDialogBody}>
			<textarea
				placeholder="Add notes..."
				bind:value={notes}
				class="flex min-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			></textarea>
		</div>
		<Dialog.Footer class={orderDialogFooter}>
			<Button variant="outline" onclick={close}>Cancel</Button>
			<Button onclick={close}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
