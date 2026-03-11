<script lang="ts">
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import { MultiSelectCombobox } from '$lib/components/organs/index.js';
	import List from '@lucide/svelte/icons/list';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { cn } from '$lib/utils.js';
	import type {
		ProductAttributeGroupDetail,
		ProductAttributeGroupAttribute
	} from '$lib/product-attribute-groups/types.js';
	import { updateAttributeGroup, deleteAttributeGroups } from '$lib/product-attribute-groups/api.js';
	import { listAttributes } from '$lib/product-attributes/api.js';
	import type { ProductAttribute } from '$lib/product-attributes/types.js';

	interface Props {
		group: ProductAttributeGroupDetail | null;
		onUpdated?: () => void | Promise<void>;
		onDeleted?: () => void | Promise<void>;
	}

	let { group, onUpdated = () => {}, onDeleted = () => {} }: Props = $props();

	let editOpen = $state(false);
	let editTitle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);
	let allAttributes = $state<ProductAttribute[]>([]);
	let allAttributesLoading = $state(false);
	let editSelectedAttributeIds = $state<string[]>([]);

	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);

	$effect(() => {
		if (!editOpen || !group) return;
		editTitle = group.title;
		editError = null;
		editSelectedAttributeIds = (group.attributes ?? []).map((a: ProductAttributeGroupAttribute) => a.id);
		loadAllAttributes();
	});

	async function loadAllAttributes() {
		allAttributesLoading = true;
		try {
			const res = await listAttributes({
				page: 1,
				limit: 100,
				sorting_field: 'title',
				sorting_direction: 'asc'
			});
			allAttributes = res.data?.rows ?? [];
		} catch {
			allAttributes = [];
		} finally {
			allAttributesLoading = false;
		}
	}

	function openEdit() {
		if (!group) return;
		editOpen = true;
	}

	function closeEdit() {
		editOpen = false;
		editError = null;
	}

	async function submitEdit() {
		if (!group) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const updated = await updateAttributeGroup(group.id, {
				title: editTitle.trim(),
				attribute_ids: editSelectedAttributeIds
			});
			group = updated;
			closeEdit();
			await onUpdated();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

	function openDeleteConfirm() {
		if (!group) return;
		deleteConfirmOpen = true;
	}

	function closeDeleteConfirm() {
		if (!deleteSubmitting) deleteConfirmOpen = false;
	}

	async function confirmDelete() {
		if (!group) return;
		deleteSubmitting = true;
		try {
			await deleteAttributeGroups([group.id]);
			deleteConfirmOpen = false;
			await onDeleted();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			deleteSubmitting = false;
		}
	}
</script>

<div class="rounded-lg border bg-card p-6 shadow-sm">
	<section class="flex flex-col gap-6">
		<div class="flex items-center justify-between gap-4">
			<h1 class="text-2xl font-semibold tracking-tight">{group?.title ?? 'Attribute Group'}</h1>
			<DropdownMenu.Root>
				<DropdownMenu.Trigger
					class="flex size-8 items-center justify-center rounded-md hover:bg-muted"
					aria-label="Actions"
				>
					<MoreHorizontal class="size-4" />
				</DropdownMenu.Trigger>
				<DropdownMenu.Portal>
					<DropdownMenu.Content
						class="z-50 min-w-32 rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
						sideOffset={4}
					>
						<DropdownMenu.Item
							textValue="Edit"
							class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={openEdit}
							disabled={!group}
						>
							<Pencil class="size-4" />
							Edit
						</DropdownMenu.Item>
						<DropdownMenu.Item
							textValue="Delete"
							class="relative flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none transition-colors hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive data-disabled:pointer-events-none data-disabled:opacity-50"
							onSelect={openDeleteConfirm}
							disabled={!group}
						>
							<Pencil class="size-4" />
							Delete
						</DropdownMenu.Item>
					</DropdownMenu.Content>
				</DropdownMenu.Portal>
			</DropdownMenu.Root>
		</div>

		{#if group}
			<dl class="grid gap-3 text-sm sm:grid-cols-2">
				<div>
					<dt class="text-muted-foreground">Created</dt>
					<dd>
						{new Date(group.created_at).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</dd>
				</div>
				<div>
					<dt class="text-muted-foreground">Updated</dt>
					<dd>
						{new Date(group.updated_at).toLocaleDateString('en-US', {
							month: 'short',
							day: 'numeric',
							year: 'numeric',
							hour: '2-digit',
							minute: '2-digit'
						})}
					</dd>
				</div>
			</dl>
		{/if}
	</section>
</div>

<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the attribute group title and attributes.
				</p>
				{#if editError && !editSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{editError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="edit-title" class="text-sm font-medium">Title</label>
						<Input
							id="edit-title"
							bind:value={editTitle}
							placeholder="e.g. Specifications"
							class={cn('h-9', editError === 'Title is required' && 'border-destructive')}
						/>
					</div>
					<div class="rounded-lg border bg-card p-4 shadow-sm">
						<div class="mb-2 flex items-center gap-2">
							<List class="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
							<h3 class="text-sm font-semibold">Attributes</h3>
						</div>
						<p class="mb-3 text-xs text-muted-foreground">
							Assign attributes to this group. They will be shown when this group is used on a
							product.
						</p>
						{#if allAttributesLoading}
							<p class="py-3 text-sm text-muted-foreground">Loading attributes…</p>
						{:else}
							<MultiSelectCombobox
								id="edit-attributes"
								options={allAttributes.map((a) => ({ id: a.id, value: a.title }))}
								bind:value={editSelectedAttributeIds}
								placeholder="Type to add…"
								emptyMessage="No attributes available."
								class="mt-1"
							/>
						{/if}
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeEdit}>Cancel</Button>
				<Button onclick={submitEdit} disabled={editSubmitting}>
					{editSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={group?.title ?? group?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>

