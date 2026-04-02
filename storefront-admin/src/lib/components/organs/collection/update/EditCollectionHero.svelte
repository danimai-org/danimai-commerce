<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import { superForm } from 'sveltekit-superforms/client';
	import { toast, Toaster } from 'svelte-sonner';
	import type { Collection } from '../type.js';

	type CollectionForEdit = NonNullable<Collection>;

	let {
		open = $bindable(false),
		collection = null as CollectionForEdit | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		collection?: CollectionForEdit | null;
		onSuccess?: () => void | Promise<void>;
	} = $props();

	let initializedForId = $state<string | null>(null);

	const { form, errors, enhance, delayed, reset } = superForm(page.data.collectionUpdateForm, {
		resetForm: false,
		onResult: async ({ result }) => {
			if (result.type === 'failure') {
				const d = result.data as { error?: string } | undefined;
				if (d?.error) toast.error(d.error);
				return;
			}
			if (result.status === 200) {
				toast.success('Collection updated successfully');
				open = false;
				if (onSuccess) await onSuccess();
			}
		}
	});

	$effect(() => {
		if (!open) {
			initializedForId = null;
			return;
		}

		const nextId = collection?.id ?? '';
		if (!nextId) return;
		if (initializedForId === nextId) return;
		initializedForId = nextId;

		reset({
			data: {
				id: collection!.id,
				title: collection!.title ?? '',
				handle: (
					collection!.handle ??
					(collection!.metadata as { handle?: string })?.handle ??
					''
				).replace(/^\//, '')
			}
		});
	});

	function close() {
		open = false;
	}
</script>

<Toaster position="top-center" richColors={true} />

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<form method="POST" action="?/update" use:enhance class="flex h-full flex-col">
			<input type="hidden" name="id" bind:value={$form.id} />

			<div class="flex-1 overflow-auto p-6 pt-12">
				<Sheet.Header>
					<Sheet.Title>Edit Collection</Sheet.Title>
					<Sheet.Description>Update the collection details below.</Sheet.Description>
				</Sheet.Header>

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
							aria-invalid={!!$errors.handle}
							class={cn($errors.handle && 'border-destructive')}
						/>
						{#if $errors.handle}
							<span class="text-xs text-destructive">{$errors.handle}</span>
						{/if}
					</div>
				</div>
			</div>

			<Sheet.Footer class="border-t p-4">
				<Button variant="outline" type="button" onclick={close}>Cancel</Button>
				<Button type="submit" disabled={$delayed}>
					{$delayed ? 'Saving...' : 'Save Changes'}
				</Button>
			</Sheet.Footer>
		</form>
	</Sheet.Content>
</Sheet.Root>
