<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { createCategory, updateCategory } from '$lib/product-categories/api.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';
	import { cn } from '$lib/utils.js';

	let {
		open = $bindable(false),
		mode = 'create',
		category = null as ProductCategory | null,
		onSuccess = () => {}
	}: {
		open?: boolean;
		mode?: 'create' | 'edit';
		category?: ProductCategory | null;
		onSuccess?: () => void;
	} = $props();

	let name = $state('');
	let handle = $state('');
	let error = $state<string | null>(null);
	let submitting = $state(false);

	$effect(() => {
		if (open) {
			error = null;
			if (mode === 'edit' && category) {
				name = category.value ?? '';
				handle = category.handle ?? '';
			} else {
				name = '';
				handle = '';
			}
		}
	});

	function close() {
		if (!submitting) open = false;
	}

	async function submit() {
		error = null;
		if (!name.trim()) {
			error = 'Name is required';
			return;
		}
		if (!handle.trim()) {
			error = 'Handle is required';
			return;
		}
		submitting = true;
		try {
			const payload = {
				value: name.trim(),
				handle: handle.trim()
			};
			if (mode === 'edit' && category) {
				await updateCategory(category.id, payload);
			} else {
				await createCategory(payload);
			}
			open = false;
			onSuccess();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}

	const sheetTitle = $derived(mode === 'edit' ? 'Edit category' : 'Create category');
	const subtitle = $derived(
		mode === 'edit' ? 'Update the category details.' : 'Add a new category.'
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
						<label for="category-name" class="text-sm font-medium">Name</label>
						<Input
							id="category-name"
							bind:value={name}
							placeholder="e.g. Category Name"
							class={cn('h-9', error === 'Name is required' && 'border-destructive')}
						/>
					</div>
					<div class="flex flex-col gap-2">
						<label for="category-handle" class="text-sm font-medium">Handle</label>
						<Input
							id="category-handle"
							bind:value={handle}
							placeholder="e.g. category-name"
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

