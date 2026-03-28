<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { Toaster, toast } from 'svelte-sonner';

	type CategoryMetadata = { handle?: string; description?: string };

	interface Props {
		category?: {
			id: string;
			title?: string;
			value?: string;
			handle?: string;
			description?: string;
			visibility?: 'public' | 'private';
			metadata?: unknown | null;
		} | null;
		onSaved?: () => void;
		onClosed?: () => void;
	}

	let { category = null, onSaved = () => {}, onClosed = () => {} }: Props = $props();

	let open = $state(false);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		{
			id: '',
			title: '',
			handle: '',
			description: '',
			visibility: 'public' as 'public' | 'private'
		},
		{
			resetForm: true,
			onResult: async ({ result }) => {
				if (result.type === 'success') {
					toast.success('Category updated successfully');
					onSaved(); // Notify parent to refresh data
					open = false; // Trigger handleOpenChange
				}
			}
		}
	);

	// Watch for category prop. If it's provided, populate form and open sheet.
	$effect(() => {
		if (category) {
			const metadata: CategoryMetadata =
				category.metadata &&
				typeof category.metadata === 'object' &&
				!Array.isArray(category.metadata)
					? (category.metadata as CategoryMetadata)
					: {};

			reset({
				data: {
					id: category.id,
					title: category.title ?? category.value ?? '',
					handle: (category.handle ?? metadata.handle ?? '').replace(/^\//, ''),
					description: category.description ?? metadata.description ?? '',
					visibility: category.visibility ?? 'public'
				}
			});

			message.set('');
			open = true;
		} else {
			// If parent passes null, ensure the sheet closes
			open = false;
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) {
			open = false;
			onClosed(); // Crucial: Tell parent to reset its 'editSheetOpen' state
			setTimeout(() => reset(), 300); // Reset form after slide-out
		}
	}

	function cancel() {
		if ($delayed) return;
		handleOpenChange(false);
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open onOpenChange={handleOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Category</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the category details.</p>

				{#if $message}
					<p class="mt-4 text-sm font-medium text-destructive">{$message}</p>
				{/if}

				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							name="title"
							bind:value={$form.title}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>

					<div class="flex flex-col gap-2">
						<label for="edit-handle" class="text-sm font-medium">Handle</label>
						<Input id="edit-handle" name="handle" bind:value={$form.handle} />
					</div>

					<div class="flex flex-col gap-2">
						<label for="edit-description" class="text-sm font-medium">Description</label>
						<textarea
							id="edit-description"
							name="description"
							bind:value={$form.description}
							class={cn(
								'flex min-h-[96px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring',
								$errors.description && 'border-destructive'
							)}
						></textarea>
					</div>

					<div class="flex flex-col gap-2">
						<label for="edit-visibility" class="text-sm font-medium">Visibility</label>
						<select
							id="edit-visibility"
							name="visibility"
							bind:value={$form.visibility}
							class="flex h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
						>
							<option value="public">Public</option>
							<option value="private">Private</option>
						</select>
					</div>
				</div>
			</div>

			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" type="button" onclick={cancel}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</div>
		</form>
	</Sheet.Content>
</Sheet.Root>
