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

<Dialog.Root bind:open onOpenChange={(o)=> {
	if (!o && !submitting) {
	handleCancel();
	}
	}}
	>
	<Dialog.Content class="flex items-center justify-center bg-transparent" style="background-color: transparent;"
		overlayClass="bg-black/50 backdrop-blur-sm" onclick={(e)=> {
		if (!submitting && e.target === e.currentTarget) {
		handleCancel();
		}
		}}
		>
		<div class="w-full max-w-md gap-0 rounded-lg border bg-card p-0 shadow-lg" role="presentation" onclick={(e)=>
			e.stopPropagation()}
			>
			<Dialog.Header class="p-6 pb-0">
				<Dialog.Title>Delete {entityName}</Dialog.Title>
			</Dialog.Header>
			<div class="px-6 py-4">
				{#if error}
				<div
					class="mb-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
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
				<Button variant="outline" disabled={submitting} onclick={handleCancel}>
					Cancel
				</Button>
				<Button variant="destructive" disabled={submitting} onclick={handleConfirm}>
					{submitting ? 'Deleting…' : 'Delete'}
				</Button>
			</Dialog.Footer>
		</div>
	</Dialog.Content>
</Dialog.Root>