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
		tag = null,
		onSaved = async () => {},
		onClosed = () => {}
	}: {
		open?: boolean;
		mode?: Mode;
		tag?: { id: string; value: string } | null;
		onSaved?: () => void | Promise<void>;
		onClosed?: () => void;
	} = $props();

	const { form, errors, enhance, message, delayed, reset } = superForm(
		{
			value: ''
		},
		{
			resetForm: true,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Tag updated successfully');
					await onSaved();
					open = false;
				}
			}
		}
	);

	function closeSheet() {
		if (!$delayed) open = false;
	}

	function onOpenChange(isOpen: boolean) {
		if (!isOpen) {
			onClosed();
			message.set('');
		}
	}

	function resetForm() {
		message.set('');
		reset({
			data: {
				value: ''
			}
		});
	}

	$effect(() => {
		if (tag) {
			reset({
				data: {
					value: tag.value
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
		<form method="POST" action="?/update" use:enhance class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Tag</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the tag value.</p>
				{#if $message}
					<p class="mt-4 text-sm text-destructive">{$message}</p>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-value" class="text-sm font-medium">Value</label>
						<Input
							id="edit-value"
							name="value"
							bind:value={$form.value}
							placeholder="e.g. sale, new-arrival"
							aria-invalid={$errors.value ? 'true' : undefined}
							class={cn('h-9', $errors.value && 'border-destructive')}
						/>
						{#if $errors.value}
							<span class="text-xs text-destructive">{$errors.value}</span>
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
