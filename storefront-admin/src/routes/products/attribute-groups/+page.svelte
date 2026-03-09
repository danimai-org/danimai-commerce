<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { cn } from '$lib/utils.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { deleteAttributeGroups } from '$lib/product-attribute-groups/api.js';
	import type { AttributeGroupsResponse, ProductAttributeGroup } from '$lib/product-attribute-groups/types.js';
	import CreateAttributeGroupSheet from '$lib/components/organs/attribute-groups/CreateAttributeGroupSheet.svelte';
	import { client } from '$lib/client';


	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const paginateState = createPagination(
		async () => {
			
			return client['product-attribute-groups'].get({ query: paginationQuery });
		},
		['product-attribute-groups']
	);

	$effect(() => {
		page.url.searchParams.toString();
		paginateState.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data);
	const rows = $derived((queryData?.data?.rows ?? []) as Record<string, unknown>[]);
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	function confirmDeleteAttributeGroup() {
		paginateState.confirmDelete((item) =>
			deleteAttributeGroups([(item as unknown as ProductAttributeGroup).id])
		);
	}

	const tableColumns: TableColumn[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/attribute-groups/${row.id}`
		},
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEdit(item as unknown as ProductAttributeGroup)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => paginateState.openDeleteConfirm(item as unknown as AttributeGroupsResponse)
				}
			]
		}
	];

	// Create sheet (local state)
	let createOpen = $state(false);

	// Edit sheet (local state)
	let editOpen = $state(false);
	let editGroup = $state<ProductAttributeGroup | null>(null);
	let editTitle = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(grp: ProductAttributeGroup) {
		editGroup = grp;
		editOpen = true;
		editTitle = grp.title;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editGroup = null;
	}

	async function submitEdit() {
		if (!editGroup) return;
		editError = null;
		if (!editTitle.trim()) {
			editError = 'Title is required';
			return;
		}
		editSubmitting = true;
		try {
			const res = await client['product-attribute-groups'].update({ id: editGroup.id, data: { title: editTitle.trim() } });
			if (!res.ok) {
				throw new Error(res.data?.error?.message || `HTTP ${res.status}`);
			}
			closeEdit();
			paginateState.refetch();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}

</script>


<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListFilter class="size-4" />
				<span class="font-semibold">Attribute Groups</span>
			</div>
			<Button size="sm" onclick={() => (createOpen = true)}>Create</Button>
		</div>

		<PaginationTable>
			{#if paginateState.error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{paginateState.error}
				</div>
			{:else if paginateState.loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rows}
							columns={tableColumns}
							emptyMessage="No attribute groups found."
						/>
					</table>
				</div>

				<TablePagination
					{pagination}
					{start}
					{end}
					onPageChange={goToPage}
				/>
			{/if}
		</PaginationTable>
	</div>
</div>

<CreateAttributeGroupSheet
	bind:open={createOpen}
	on:created={() => paginateState.refetch()}
/>

<!-- Edit Attribute Group Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Attribute Group</h2>
				<p class="mt-1 text-sm text-muted-foreground">Update the attribute group title.</p>
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
	bind:open={paginateState.deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={(paginateState.deleteItem as unknown as ProductAttributeGroup)?.title || (paginateState.deleteItem as unknown as ProductAttributeGroup)?.id || ''}
	onConfirm={confirmDeleteAttributeGroup}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
/>
{#if paginateState.deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{paginateState.deleteError}
	</div>
{/if}
