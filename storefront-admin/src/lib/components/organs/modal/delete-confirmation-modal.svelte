<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	let {
		open = $bindable(false),
		entityName,
		entityTitle,
		onConfirm,
		onCancel,
		submitting = false,
		error,
		customMessage
	}: {
		open?: boolean;
		entityName: string;
		entityTitle: string;
		onConfirm: () => void | Promise<void>;
		onCancel?: () => void;
		submitting?: boolean;
		error?: string | null;
		customMessage?: string;
	} = $props();

	function handleCancel() {
		if (!submitting && onCancel) {
			onCancel();
		}
		if (!submitting) {
			open = false;
		}
	}

	function handleConfirm() {
		onConfirm();
	}
</script>

<Dialog.Root
	bind:open
	onOpenChange={(o) => {
		if (!o && !submitting) {
			handleCancel();
		}
	}}
>
	<Dialog.Content
		class="inset-auto top-1/2 left-1/2 h-auto max-h-[min(85vh,85dvh)] w-[min(28rem,calc(100vw-2rem))] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col overflow-auto rounded-lg border bg-card p-0 shadow-lg"
		overlayClass="bg-black/50 backdrop-blur-sm"
	>
		<Dialog.Header class="p-6 pb-0">
			<Dialog.Title>Delete {entityName}</Dialog.Title>
		</Dialog.Header>
		<div class="px-6 py-4">
			{#if error}
				<div
					class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
				>
					{error}
				</div>
			{/if}
			<p class="text-sm text-muted-foreground">
				{#if customMessage}
					{customMessage}
				{:else}
					Are you sure you want to delete
					<strong class="text-foreground">{entityTitle}</strong>? This action cannot be undone.
				{/if}
			</p>
		</div>
		<Dialog.Footer class="flex flex-row justify-end gap-2 border-t p-4">
			<Button variant="outline" disabled={submitting} onclick={handleCancel}>Cancel</Button>
			<Button variant="destructive" disabled={submitting} onclick={handleConfirm}>
				{submitting ? 'Deleting…' : 'Delete'}
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
