<script lang="ts">
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import { cn } from '$lib/utils.js';
	import type { ProductDetail } from '$lib/hooks/use-product-detail.svelte.js';

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	type EditAttributeRow = { attribute_id: string; title: string; value: string };

	interface Props {
		open: boolean;
		product: ProductDetail | null;
		onSaved: () => void | Promise<void>;
	}

	let { open = $bindable(false), product, onSaved }: Props = $props();

	let editTitle = $state('');
	let editSubtitle = $state('');
	let editHandle = $state('');
	let editDescription = $state('');
	let editStatus = $state<'draft' | 'proposed' | 'published' | 'rejected'>('draft');
	let editDiscountable = $state(true);
	let editProductAttributesList = $state<EditAttributeRow[]>([]);
	let editProductAddAttributeId = $state('');
	let editProductAddAttributeValue = $state('');
	let editAttributeGroupId = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);
	let availableAttributesList = $state<Array<{ id: string; title: string; type: string }>>([]);
	let attributeGroupsList = $state<Array<{ id: string; title: string }>>([]);

	const editProductAttributesAvailableToAdd = $derived(
		availableAttributesList.filter(
			(a) => !editProductAttributesList.some((e) => e.attribute_id === a.id)
		)
	);

	$effect(() => {
		if (open && product?.id) {
			editTitle = product.title ?? '';
			editSubtitle = product.subtitle ?? '';
			editHandle = product.handle
				? product.handle.startsWith('/')
					? product.handle.slice(1)
					: product.handle
				: '';
			editDescription = product.description ?? '';
			editStatus = (product.status as 'draft' | 'proposed' | 'published' | 'rejected') || 'draft';
			editDiscountable = product.discountable !== false;
			editProductAttributesList = (product.attributes ?? []).map((a) => ({
				attribute_id: a.id,
				title: a.title,
				value: a.value ?? ''
			}));
			editAttributeGroupId = product.attribute_group_id ?? '';
			editProductAddAttributeId = '';
			editProductAddAttributeValue = '';
			editError = null;
			loadAvailableAttributes();
			loadAttributeGroups();
		}
	});

	async function loadAvailableAttributes() {
		try {
			const res = await fetch(`${API_BASE}/product-attributes?limit=100`, { cache: 'no-store' });
			if (res.ok) {
				const j = (await res.json()) as { rows?: Array<{ id: string; title: string; type: string }> };
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

	function removeEditProductAttribute(index: number) {
		editProductAttributesList = editProductAttributesList.filter((_, i) => i !== index);
	}

	function addEditProductAttribute() {
		if (!editProductAddAttributeId) return;
		const att = availableAttributesList.find((a) => a.id === editProductAddAttributeId);
		if (!att) return;
		editProductAttributesList = [
			...editProductAttributesList,
			{ attribute_id: att.id, title: att.title, value: editProductAddAttributeValue.trim() }
		];
		editProductAddAttributeId = '';
		editProductAddAttributeValue = '';
	}

	function closeSheet() {
		open = false;
		editError = null;
	}

	async function submitEditProduct() {
		if (!product?.id) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const handle =
				editHandle.trim() ||
				editTitle
					.toLowerCase()
					.replace(/\s+/g, '-')
					.replace(/[^a-z0-9-]/g, '');
			const body: Record<string, unknown> = {
				title: editTitle.trim(),
				subtitle: editSubtitle.trim() || undefined,
				description: editDescription.trim() || undefined,
				handle,
				status: editStatus,
				discountable: editDiscountable,
				attribute_group_id: editAttributeGroupId || undefined,
				attribute_groups:
					editAttributeGroupId && editProductAttributesList.length > 0
						? [{ attribute_group_id: editAttributeGroupId, required: false, rank: 0 }]
						: undefined,
				attributes:
					editAttributeGroupId && editProductAttributesList.length > 0
						? editProductAttributesList.map((a) => ({
								attribute_group_id: editAttributeGroupId,
								attribute_id: a.attribute_id,
								value: a.value
							}))
						: undefined
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
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<Sheet.Root bind:open>
	<Sheet.Content class="flex w-full flex-col sm:max-w-lg" side="right">
		<Sheet.Header class="flex flex-col items-center gap-1.5 text-center sm:text-center">
			<Sheet.Title>Edit Product</Sheet.Title>
		</Sheet.Header>
		<div class="flex flex-1 flex-col gap-4 overflow-auto px-4 pb-4">
			<div class="flex flex-col gap-2">
				<label for="edit-status" class="text-sm font-medium">Status</label>
				<select
					id="edit-status"
					bind:value={editStatus}
					class="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
				>
					<option value="draft">Draft</option>
					<option value="proposed">Proposed</option>
					<option value="published">Published</option>
					<option value="rejected">Rejected</option>
				</select>
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-title" class="text-sm font-medium">Title</label>
				<Input id="edit-title" bind:value={editTitle} class="h-9" />
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-subtitle" class="text-sm font-medium">
					Subtitle <span class="font-normal text-muted-foreground">(Optional)</span>
				</label>
				<Input id="edit-subtitle" bind:value={editSubtitle} class="h-9" />
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-handle" class="text-sm font-medium">Handle</label>
				<div class="relative flex w-full items-center">
					<span class="absolute start-3 text-sm text-muted-foreground">/</span>
					<Input
						id="edit-handle"
						bind:value={editHandle}
						class="h-9 pl-6"
						placeholder="product-handle"
					/>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<span class="text-sm font-medium">Attributes</span>
				<div class="space-y-2">
					{#each editProductAttributesList as row, i (row.attribute_id + i)}
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
								onclick={() => removeEditProductAttribute(i)}
							>
								<Trash2 class="size-4" />
							</Button>
						</div>
					{/each}
					{#if editProductAttributesAvailableToAdd.length > 0}
						<div class="flex flex-wrap items-end gap-2 rounded-md border border-dashed p-2">
							<select
								bind:value={editProductAddAttributeId}
								class="flex h-9 min-w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
							>
								<option value="">Add attribute…</option>
								{#each editProductAttributesAvailableToAdd as att (att.id)}
									<option value={att.id}>{att.title}</option>
								{/each}
							</select>
							<Input
								bind:value={editProductAddAttributeValue}
								class="h-9 min-w-24 flex-1"
								placeholder="Value"
							/>
							<Button
								type="button"
								variant="secondary"
								size="sm"
								onclick={addEditProductAttribute}
								disabled={!editProductAddAttributeId}
							>
								Add
							</Button>
						</div>
					{/if}
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<label for="edit-description" class="text-sm font-medium">
					Description <span class="font-normal text-muted-foreground">(Optional)</span>
				</label>
				<textarea
					id="edit-description"
					bind:value={editDescription}
					rows="3"
					class="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
				></textarea>
			</div>
			<div class="flex flex-col gap-2">
				<div class="flex items-center gap-2">
					<button
						id="edit-discountable"
						type="button"
						role="switch"
						aria-checked={editDiscountable}
						aria-label="Discountable"
						class={cn(
							'relative inline-flex h-6 min-h-6 w-11 min-w-11 flex-none shrink-0 cursor-pointer items-center self-center rounded-full border-2 border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
							editDiscountable ? 'bg-primary' : 'bg-input'
						)}
						onclick={() => (editDiscountable = !editDiscountable)}
					>
						<span
							class={cn(
								'pointer-events-none block size-5 shrink-0 rounded-full border border-input bg-white shadow ring-0 transition-transform',
								editDiscountable ? 'translate-x-5' : 'translate-x-px'
							)}
						></span>
					</button>
					<label for="edit-discountable" class="text-sm font-medium">Discountable</label>
				</div>
				<p class="text-xs text-muted-foreground">
					When unchecked, discounts will not be applied to this product.
				</p>
			</div>
			{#if editError}
				<p class="text-sm text-destructive">{editError}</p>
			{/if}
		</div>
		<Sheet.Footer class="flex justify-end gap-2 border-t p-4">
			<Button variant="outline" onclick={closeSheet} disabled={editSubmitting}>
				Cancel
			</Button>
			<Button onclick={submitEditProduct} disabled={editSubmitting}>
				{editSubmitting ? 'Saving…' : 'Save'}
			</Button>
		</Sheet.Footer>
	</Sheet.Content>
</Sheet.Root>
