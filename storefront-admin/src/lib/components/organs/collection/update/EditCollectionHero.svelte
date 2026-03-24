<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';

	interface Collection {
		id: string;
		title?: string;
		handle?: string;
		metadata?: { handle?: string } | null;
	}

	interface Props {
		collection: Collection | null;
		onSaved?: () => void | Promise<void>;
		onClosed: () => void;
	}

	let { collection, onSaved, onClosed }: Props = $props();
	let open = $derived(!!collection);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		{ id: '', title: '', handle: '' },
		{
			invalidateAll: true,
			onResult: async ({ result }) => {
				if (result.type === 'success') {
					toast.success('Collection updated successfully');
					if (onSaved) await onSaved();
					onClosed(); // Close the sheet via the parent
				}
			}
		}
	);
	// Update form data only when a NEW collection is selected
	$effect(() => {
		if (collection) {
			reset({
				data: {
					id: collection.id,
					title: collection.title ?? '',
					handle: (collection.handle ?? collection.metadata?.handle ?? '').replace(/^\//, '')
				}
			});
		}
	});

	function handleOpenChange(isOpen: boolean) {
		if (!isOpen) onClosed();
	}
</script>

<Toaster position="top-center" richColors={true} />

<Sheet.Root {open} onOpenChange={handleOpenChange}>
	<Sheet.Content side="right" class="w-full max-w-md">
		<form method="POST" action="?/update" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<Sheet.Header>
					<Sheet.Title>Edit Collection</Sheet.Title>
					<Sheet.Description>Update the collection details below.</Sheet.Description>
				</Sheet.Header>

				{#if $message}
					<p class="mt-4 text-sm text-destructive">{$message}</p>
				{/if}

				<div class="mt-6 space-y-4">
					<div class="grid gap-2">
						<label for="title" class="text-sm font-medium">Title</label>
						<Input
							id="title"
							name="title"
							bind:value={$form.title}
							aria-invalid={!!$errors.title}
							class={cn($errors.title && 'border-destructive')}
						/>
						{#if $errors.title}
							<span class="text-xs text-destructive">{$errors.title}</span>
						{/if}
					</div>

					<div class="grid gap-2">
						<label for="handle" class="text-sm font-medium">Handle</label>
						<Input
							id="handle"
							name="handle"
							bind:value={$form.handle}
							class={cn($errors.handle && 'border-destructive')}
						/>
					</div>
				</div>
			</div>

			<Sheet.Footer class="border-t p-4">
				<Button variant="outline" type="button" onclick={onClosed}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save Changes'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
