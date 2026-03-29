<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { Toaster, toast } from 'svelte-sonner';
	import type { Category } from '../type';

	type CategoryData = NonNullable<Category>;

	let {
		open = $bindable(false),
		category = null as CategoryData | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		category?: CategoryData | null;
		onSuccess?: () => void | Promise<void>;
	} = $props();

	let initializedForId = $state<string | null>(null);

	const { form, errors, enhance, delayed, message, reset } = superForm(
		{
			id: '',
			title: '',
			handle: '',
			description: '',
			visibility: 'public' as 'public' | 'private'
		},
		{
			resetForm: false,
			onResult: async ({ result }) => {
				if (result.status === 200) {
					toast.success('Category updated successfully');
					open = false;
					if (onSuccess) await onSuccess();
				}
			}
		}
	);

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}

		const nextId = category?.id ?? '';
		if (!nextId) return;
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		message.set('');
		reset({
			data: {
				id: category!.id,
				title: category!.value ?? '',
				handle: (category!.handle ?? '').replace(/^\//, ''),
				description: (category!.metadata as { description?: string })?.description ?? '',
				visibility: category!.visibility
			}
		});
	});

	function close() {
		open = false;
	}
</script>

<Toaster richColors position="top-center" />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form action="?/update" method="POST" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<Sheet.Header>
					<Sheet.Title>Edit Category</Sheet.Title>
					<Sheet.Description>Update the category details below.</Sheet.Description>
				</Sheet.Header>

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

			<Sheet.Footer class="border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
