<script lang="ts">
	import EditAttributeGroupSheet from '../update/EditAttributeGroupSheet.svelte';
	import { DeleteConfirmationModal } from '$lib/components/organs/index.js';
	import Pencil from '@lucide/svelte/icons/pencil';
	import MoreHorizontal from '@lucide/svelte/icons/more-horizontal';
	import { DropdownMenu } from 'bits-ui';
	import { client } from '$lib/client';

	interface Props {
		group: any | null;
		onRefetch?: () => void | Promise<void>;
		onUpdated?: () => void | Promise<void>;
		onDeleted?: () => void | Promise<void>;
	}

	let { group, onRefetch = () => {}, onUpdated = () => {}, onDeleted = () => {} }: Props = $props();

	let editGroup = $state<any | null>(null);

	let deleteConfirmOpen = $state(false);
	let deleteSubmitting = $state(false);

	function openEdit() {
		if (!group) return;
		editGroup = group;
	}

	async function handleEditSaved() {
		await onRefetch();
		editGroup = null;
		await onUpdated();
	}

	function handleEditClosed() {
		editGroup = null;
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
			await client['product-attribute-groups'].delete({ attribute_group_ids: [group.id] });
			await onRefetch();
			deleteConfirmOpen = false;
			await onDeleted();
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

<EditAttributeGroupSheet group={editGroup} onSaved={handleEditSaved} onClosed={handleEditClosed} />

<DeleteConfirmationModal
	bind:open={deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={group?.title ?? group?.id ?? ''}
	onConfirm={confirmDelete}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>

