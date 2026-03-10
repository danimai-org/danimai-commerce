<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import type { ProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	type EditAttributeRow = { attribute_id: string; title: string; value: string };

	interface Props {
		open: boolean;
		product: ProductDetail | null;
		onSaved: () => void | Promise<void>;
	}

	let { open = $bindable(false), product, onSaved }: Props = $props();

	let editAttributesList = $state<EditAttributeRow[]>([]);
	let editAttributeGroupId = $state('');
	let addAttributeId = $state('');
	let addAttributeValue = $state('');
	let editAttributesError = $state<string | null>(null);
	let editAttributesSubmitting = $state(false);
	let availableAttributesList = $state<Array<{ id: string; title: string; type: string }>>([]);
	let attributeGroupsList = $state<Array<{ id: string; title: string }>>([]);

	const attributesAvailableToAdd = $derived(
		availableAttributesList.filter((a) => !editAttributesList.some((e) => e.attribute_id === a.id))
	);

	$effect(() => {
		if (open && product?.id) {
			editAttributesList = (product.attributes ?? []).map((a) => ({
				attribute_id: a.id,
				title: a.title,
				value: a.value ?? ''
			}));
			editAttributeGroupId = product.attribute_group_id ?? '';
			addAttributeId = '';
			addAttributeValue = '';
			editAttributesError = null;
			loadAvailableAttributes();
			loadAttributeGroups();
		}
	});

	async function loadAvailableAttributes() {
		try {
			const res = await fetch(`${API_BASE}/product-attributes?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as {
					rows?: Array<{ id: string; title: string; type: string }>;
				};
				availableAttributesList = j.rows ?? [];
			} else {
				availableAttributesList = [];
			}
		} catch {
			availableAttributesList = [];
		}
	}

	async function loadAttributeGroups() {
		try {
			const res = await fetch(`${API_BASE}/product-attribute-groups?limit=100`, {
				cache: 'no-store'
			});
			if (res.ok) {
				const j = (await res.json()) as { rows?: Array<{ id: string; title: string }> };
				attributeGroupsList = j.rows ?? [];
			} else {
				attributeGroupsList = [];
			}
		} catch {
			attributeGroupsList = [];
		}
	}

	function removeAttributeFromEdit(index: number) {
		editAttributesList = editAttributesList.filter((_, i) => i !== index);
	}

	function addAttributeToEdit() {
		if (!addAttributeId) return;
		const att = availableAttributesList.find((a) => a.id === addAttributeId);
		if (!att) return;
		editAttributesList = [
			...editAttributesList,
			{ attribute_id: att.id, title: att.title, value: addAttributeValue.trim() }
		];
		addAttributeId = '';
		addAttributeValue = '';
	}

	function closeSheet() {
		open = false;
		editAttributesError = null;
	}

	async function submitEditAttributes() {
		if (!product?.id) return;
		if (editAttributesList.length > 0 && !editAttributeGroupId) {
			editAttributesError = 'Select an attribute group when setting attributes.';
			return;
		}
		editAttributesError = null;
		editAttributesSubmitting = true;
		try {
			const body = {
				attribute_group_id: editAttributeGroupId || undefined,
				attribute_groups:
					editAttributeGroupId && editAttributesList.length > 0
						? [{ attribute_group_id: editAttributeGroupId, required: false, rank: 0 }]
						: undefined,
				attributes:
					editAttributeGroupId && editAttributesList.length > 0
						? editAttributesList.map((a) => ({
								attribute_group_id: editAttributeGroupId,
								attribute_id: a.attribute_id,
								value: a.value
							}))
						: []
			};
			const res = await fetch(`${API_BASE}/products/${product.id}`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `HTTP ${res.status}`);
			}
			closeSheet();
			await onSaved();
		} catch (e) {
			editAttributesError = e instanceof Error ? e.message : String(e);
		} finally {
			editAttributesSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
			<Sheet.Title>Edit Attributes</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
			<div class="space-y-3">
				{#each editAttributesList as row, i (row.attribute_id + i)}
					<div class="flex items-center gap-2 rounded-md border p-2">
						<div class="min-w-0 flex-1">
							<span class="text-sm font-medium text-muted-foreground">{row.title}</span>
							<Input bind:value={row.value} class="mt-1 h-9" placeholder="Value" />
						</div>
						<Button
							type="button"
							variant="ghost"
							size="icon"
							class="size-8 shrink-0"
							aria-label="Remove attribute"
							onclick={() => removeAttributeFromEdit(i)}
						>
							<Trash2 class="size-4" />
						</Button>
					</div>
				{/each}
			</div>
			{#if attributesAvailableToAdd.length > 0}
				<div class="flex flex-col gap-2 rounded-md border border-dashed p-3">
					<span class="text-sm font-medium">Add attribute</span>
					<div class="flex flex-wrap items-end gap-2">
						<select
							bind:value={addAttributeId}
							class="flex h-9 min-w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
						>
							<option value="">Select…</option>
							{#each attributesAvailableToAdd as att (att.id)}
								<option value={att.id}>{att.title}</option>
							{/each}
						</select>
						<Input
							bind:value={addAttributeValue}
							class="h-9 min-w-24 flex-1"
							placeholder="Value"
						/>
						<Button
							type="button"
							variant="secondary"
							size="sm"
							onclick={addAttributeToEdit}
							disabled={!addAttributeId}
						>
							Add
						</Button>
					</div>
				</div>
			{/if}
			{#if editAttributesError}
				<p class="text-sm text-destructive">{editAttributesError}</p>
			{/if}
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button
				variant="outline"
				onclick={closeSheet}
				disabled={editAttributesSubmitting}
			>
				Cancel
			</Button>
			<Button onclick={submitEditAttributes} disabled={editAttributesSubmitting}>
				{editAttributesSubmitting ? 'Saving…' : 'Save'}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
