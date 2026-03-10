<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn,
		CollectionFormSheet
	} from '$lib/components/organs/index.js';
	import FileText from '@lucide/svelte/icons/file-text';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { deleteCollections } from '$lib/product-collection/api.js';
	import type { ProductCollection } from '$lib/product-collection/types.js';
	import { client } from '$lib/client';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client['collections'].get({ query: paginationQuery });
		},
		['collections']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rows = $derived(
		(paginateState.query.data?.data?.rows as ProductCollection[] | undefined)?.map((c) => ({
			...c,
			handle_display: c.handle.startsWith('/') ? c.handle : `/${c.handle}`
		})) ?? []
	);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const refetch = $derived(paginateState.refetch);

	const tableColumns: TableColumn[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/collections/${row.id}`,
			textKey: 'title'
		},
		{ label: 'Handle', key: 'handle_display', type: 'text' },
		{ label: 'Products', key: 'product_count', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => openEdit(item as Parameters<typeof openEdit>[0])
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as Parameters<typeof openDeleteConfirm>[0])
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Collections | Products | Danimai Store</title>
	<meta name="description" content="Manage product collections." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<FileText class="size-4" />
				<span class="font-semibold">Collections</span>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" size="sm">
					<GripVertical class="mr-1.5 size-4" />
					Edit ranking
				</Button>
				<Button size="sm" onclick={openCreate}>Create</Button>
			</div>
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
							emptyMessage="No collections found."
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

<CollectionFormSheet
	bind:open={paginateState.formSheetOpen}
	mode={formMode}
	collection={formItem as ProductCollection | null}
	onSuccess={refetch}
/>

<!-- Delete collection confirmation -->
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="collection"
	entityTitle={(deleteItem as unknown as ProductCollection)?.title ?? (deleteItem as unknown as ProductCollection)?.handle ?? (deleteItem as unknown as ProductCollection)?.id ?? ''}
	onConfirm={() => confirmDelete((item) => deleteCollections([(item as unknown as ProductCollection).id]))}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
/>
{#if deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{deleteError}
	</div>
{/if}
