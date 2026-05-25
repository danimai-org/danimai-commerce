<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Dialog from '$lib/components/ui/dialog/index.js';

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
	<Dialog.Content
		class="top-1/2 left-1/2 flex h-auto max-h-[85vh] w-full max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-xl border p-0 shadow-lg"
	>
		<Dialog.Header class="border-b px-6 py-4">
			<Dialog.Title class="text-base font-semibold">Edit Notes</Dialog.Title>
		</Dialog.Header>
		<div class="px-6 py-4">
			<textarea
				placeholder="Add notes..."
				bind:value={notes}
				class="flex min-h-32 w-full resize-none rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
			></textarea>
		</div>
		<Dialog.Footer class="!flex-row justify-end gap-2 border-t px-6 py-4">
			<Button variant="outline" onclick={close}>Cancel</Button>
			<Button onclick={close}>Save</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
