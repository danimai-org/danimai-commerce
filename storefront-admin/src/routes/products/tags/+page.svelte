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
	import Tag from '@lucide/svelte/icons/tag';
	import { cn } from '$lib/utils.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { deleteTags, createTag, updateTag } from '$lib/product-tags/api.js';
	import type { TagsResponse, ProductTag } from '$lib/product-tags/types.js';
	import { client } from '$lib/client';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const paginateState = $state(createPagination(
		async () => {
			return client['product-tags'].get({ query: paginationQuery });
		},
		['product-tags']
	));

	$effect(() => {
		page.url.searchParams.toString();
		paginateState?.refetch();
	});

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState?.query.data as TagsResponse | undefined);
	const rows = $derived((queryData?.data?.rows ?? []) as Record<string, unknown>[]);
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState?.start);
	const end = $derived(paginateState?.end);

	function confirmDeleteTag() {
		paginateState.confirmDelete((item) =>
			deleteTags([(item as unknown as ProductTag).id])
		);
	}

	const tableColumns: TableColumn[] = [
		{
			label: 'Value',
			key: 'value',
			type: 'link',
			cellHref: (row) => `/products/tags/${row.id}`
		},
		{ label: 'Created', key: 'created_at', type: 'date' },
		{ label: 'Updated', key: 'updated_at', type: 'date' },
		{ label: 'Actions', key: 'actions', type: 'actions', actions: [	
			{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => openEdit(item as unknown as ProductTag) },
			{ label: 'Delete', key: 'delete', type: 'button', onClick: (item) => paginateState.openDeleteConfirm((item as unknown as ProductTag)) }
		] },
	];

	// Create sheet (local state)
	let createOpen = $state(false);
	let createValue = $state('');
	let createError = $state<string | null>(null);
	let createSubmitting = $state(false);

	function openCreate() {
		createOpen = true;
		createValue = '';
		createError = null;
	}

	function closeCreate() {
		createOpen = false;
	}

	async function submitCreate() {
		createError = null;
		if (!createValue.trim()) {
			createError = 'Value is required';
			return;
		}
		createSubmitting = true;
		try {
			await createTag({ value: createValue.trim() });
			closeCreate();
			paginateState.refetch();
		} catch (e) {
			createError = e instanceof Error ? e.message : String(e);
		} finally {
			createSubmitting = false;
		}
	}

	// Edit sheet (local state)
	let editOpen = $state(false);
	let editTag = $state<ProductTag | null>(null);
	let editValue = $state('');
	let editError = $state<string | null>(null);
	let editSubmitting = $state(false);

	function openEdit(tag: ProductTag) {
		editTag = tag;
		editOpen = true;
		editValue = tag.value;
		editError = null;
	}

	function closeEdit() {
		editOpen = false;
		editTag = null;
	}

	async function submitEdit() {
		if (!editTag) return;
		editError = null;
		if (!editValue.trim()) {
			editError = 'Value is required';
			return;
		}
		editSubmitting = true;
		try {
			await updateTag(editTag.id, { value: editValue.trim() });
			closeEdit();
			paginateState.refetch();
		} catch (e) {
			editError = e instanceof Error ? e.message : String(e);
		} finally {
			editSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Tags | Products | Danimai Store</title>
	<meta name="description" content="Manage product tags." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Tag class="size-4" />
				<span class="font-semibold">Tags</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
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
							emptyMessage="No tags found."
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

<!-- Create Tag Sheet -->
<Sheet.Root bind:open={createOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Create Tag</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Add a new product tag.
				</p>
				{#if createError && !createSubmitting}
					<div
						class="mt-4 rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive"
					>
						{createError}
					</div>
				{/if}
				<div class="mt-6 flex flex-col gap-4">
					<div class="flex flex-col gap-2">
						<label for="create-value" class="text-sm font-medium">Value</label>
						<Input
							id="create-value"
							bind:value={createValue}
							placeholder="e.g. sale, new-arrival"
							class={cn('h-9', createError === 'Value is required' && 'border-destructive')}
						/>
					</div>
				</div>
			</div>
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={closeCreate}>Cancel</Button>
				<Button onclick={submitCreate} disabled={createSubmitting}>
					{createSubmitting ? 'Creating…' : 'Create'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<!-- Edit Tag Sheet -->
<Sheet.Root bind:open={editOpen}>
	<Sheet.Content side="right" class="w-full max-w-md sm:max-w-md">
		<div class="flex h-full flex-col">
			<div class="flex-1 overflow-auto p-6 pt-12">
				<h2 class="text-lg font-semibold">Edit Tag</h2>
				<p class="mt-1 text-sm text-muted-foreground">
					Update the tag value.
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
						<label for="edit-value" class="text-sm font-medium">Value</label>
						<Input
							id="edit-value"
							bind:value={editValue}
							placeholder="e.g. sale, new-arrival"
							class={cn('h-9', editError === 'Value is required' && 'border-destructive')}
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
	entityName="tag"
	entityTitle={(paginateState.deleteItem as unknown as ProductTag)?.value || (paginateState.deleteItem as unknown as ProductTag)?.id || ''}
	onConfirm={confirmDeleteTag}
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
