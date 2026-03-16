<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { Toaster, toast } from 'svelte-sonner';

	type Mode = 'update';

	let {
		open = $bindable(false),
		mode = 'update',
		attribute = null,
		onSaved = async () => {},
		onClosed = () => {}
	}: {
		open?: boolean;
		mode?: Mode;
		attribute?: { id: string; title: string; type: string } | null;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void | Promise<void>;
	} = $props();

	const { form, errors, enhance, message, delayed, reset } = superForm(
		{
			id: '',
			title: '',
			type: ''
		},
		{
			resetForm: true,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Attribute updated successfully');
					await onSaved();
					open = false;
				}
			}
		}
	);

	function closeSheet() {
		if (!$delayed) open = false;
	}

	function resetForm() {
		message.set('');
		reset({
			data: {
				id: '',
				title: '',
				type: ''
			}
		});
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClosed();
			message.set('');
		}
	}

	$effect(() => {
		if (attribute) {
			reset({
				data: {
					id: attribute.id,
					title: attribute.title,
					type: attribute.type
				}
			});
			open = true;
			return;
		}

		if (!open) {
			resetForm();
		}
	});
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open={open} onOpenChange={onOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute details.</p>
				{#if $message}
					<p class="mt-4 text-sm text-destructive">{$message}</p>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							name="title"
							bind:value={$form.title}
							placeholder="e.g. Color"
							aria-invalid={$errors.title ? 'true' : undefined}
							class={cn('h-9', $errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>
					<div class="flex flex-col gap-2">
						<label for="edit-type" class="text-sm font-medium">Type</label>
						<Input
							id="edit-type"
							name="type"
							bind:value={$form.type}
							placeholder="e.g. string, number, boolean, date"
							aria-invalid={$errors.type ? 'true' : undefined}
							class={cn('h-9', $errors.type && 'border-destructive')}
						/>
						{#if $errors.type}
							<span class="text-xs text-destructive">{$errors.type}</span>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={closeSheet}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
