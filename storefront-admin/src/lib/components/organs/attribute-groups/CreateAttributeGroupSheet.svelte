<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { MultiSelectCombobox } from '$lib/components/organs/multi-select-combobox/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { cn } from '$lib/utils.js';
	import type { ProductAttribute } from '$lib/product-attributes/types.js';
	import { listAttributes } from '$lib/product-attributes/api.js';
	import type { ProductAttributeGroup } from '$lib/product-attribute-groups/types.js';
	import { createEventDispatcher } from 'svelte';

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

let { open = $bindable(false) } = $props<{ open?: boolean }>();

const dispatch = createEventDispatcher<{ created: void }>();

	let title = $state('');
	let attributeIds = $state<string[]>([]);
	let error = $state<string | null>(null);
	let submitting = $state(false);
	let availableAttributes = $state<ProductAttribute[]>([]);
	let attributesLoading = $state(false);
	let attributesLoadError = $state<string | null>(null);
	let attributesRequested = $state(false);

	$effect(() => {
		if (!open) {
			title = '';
			attributeIds = [];
			error = null;
			attributesLoadError = null;
			attributesRequested = false;
		}
	});

	async function fetchAvailableAttributes() {
		if (attributesRequested) return;
		attributesRequested = true;
		attributesLoading = true;
		attributesLoadError = null;
		try {
			const res = await listAttributes({
				page: 1,
				limit: 100,
				sorting_field: 'title',
				sorting_direction: 'asc'
			});
			availableAttributes = res.data?.rows ?? [];
		} catch (e) {
			attributesLoadError = e instanceof Error ? e.message : 'Failed to load attributes';
			availableAttributes = [];
		} finally {
			attributesLoading = false;
		}
	}

	function handleCancel() {
		open = false;
	}

	async function handleSubmit() {
		error = null;
		if (!title.trim()) {
			error = 'Title is required';
			return;
		}
		submitting = true;
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ title: title.trim() })
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			const created = (await res.json()) as ProductAttributeGroup;
			if (attributeIds.length > 0) {
				const updateRes = await fetch(`${API_BASE}/product-attribute-groups/${created.id}`, {
					method: 'PUT',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ attribute_ids: attributeIds })
				});
				if (!updateRes.ok) {
					const text = await updateRes.text();
					throw new Error(text || `HTTP ${updateRes.status}`);
				}
			}
			open = false;
			dispatch('created');
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			submitting = false;
		}
	}
</script>

<Sheet.Root bind:open={open}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new attribute group (e.g. Specifications, Dimensions). Assign attributes to this group to use them on products.
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
						<label for="create-title" class="text-sm font-medium">Title</label>
						<Input
							id="create-title"
							bind:value={title}
							placeholder="e.g. Specifications"
							class={cn('h-9', error === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="rounded-lg border bg-card p-4">
						<div class="mb-3 flex items-center gap-2">
							<ListFilter class="size-4 text-muted-foreground" />
							<label for="create-attributes" class="text-sm font-semibold">Attributes</label>
						</div>
						<p class="mb-3 text-xs text-muted-foreground">
							Optional. Assign attributes to this group to use them on products.
						</p>
						{#if attributesLoading}
							<p class="py-3 text-sm text-muted-foreground">Loading attributes…</p>
						{:else if attributesLoadError}
							<p class="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-3 text-sm text-destructive">
								{attributesLoadError}
							</p>
						{:else}
							<MultiSelectCombobox
								id="create-attributes"
								options={availableAttributes.map((a) => ({ id: a.id, value: a.title }))}
								bind:value={attributeIds}
								placeholder="Type to add…"
								emptyMessage="No attributes available."
								class="mt-1"
								onOpen={fetchAvailableAttributes}
							/>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={handleCancel}>Cancel</Button>
				<Button onclick={handleSubmit} disabled={submitting}>
					{submitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

