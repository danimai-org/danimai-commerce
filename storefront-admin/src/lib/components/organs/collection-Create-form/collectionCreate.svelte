<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { createCollection, updateCollection } from '$lib/product-collection/api.js';
	import type { ProductCollection } from '$lib/product-collection/types.js';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		mode = 'create',
		collection = null as ProductCollection | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		collection?: ProductCollection | null;
		onSuccess?: () => void;
	} = $props();

	let title = $state('');
	let handle = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && collection) {
				title = collection.title;
				handle = collection.handle;
			} else {
				title = '';
				handle = '';
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		error = null;
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		if (!handle.trim()) {
			error = 'Handle is required';
			return;
		}
		submitting = true;
		try {
			const payload = {
				title: title.trim(),
				handle: handle.trim()
			};
			if (mode === 'edit' && collection) {
				await updateCollection(collection.id, payload);
			} else {
				await createCollection(payload);
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const sheetTitle = $derived(mode === 'edit' ? 'Edit collection' : 'Create collection');
	const subtitle = $derived(
		mode === 'edit' ? 'Update the collection details.' : 'Add a new collection.'
	);
	const submitLabel = $derived(
		submitting ? (mode === 'edit' ? 'Saving…' : 'Creating…') : mode === 'edit' ? 'Save' : 'Create'
	);
</script>

<Sheet.Root bind:open>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">{sheetTitle}</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					{subtitle}
				</p>
				{#if error && !submitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{error}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="collection-title" class="text-sm font-medium">Title</label>
						<Input
							id="collection-title"
							bind:value={title}
							placeholder="e.g. Summer Collection"
							class={cn('h-9', error === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="collection-handle" class="text-sm font-medium">Handle</label>
						<Input
							id="collection-handle"
							bind:value={handle}
							placeholder="e.g. summer-collection"
							class={cn('h-9', error === 'Handle is required' && 'border-destructive')}
						/>
						<p class="text-xs text-muted-foreground">
							Shown in URLs; use lowercase and hyphens. A leading “/” will be added when displayed.
						</p>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={close}>Cancel</Button>
				<Button onclick={submit} disabled={submitting}>
					{submitLabel}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

