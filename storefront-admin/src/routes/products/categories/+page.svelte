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
		CategoryFormSheet
	} from '$lib/components/organs/index.js';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import FolderTree from '@lucide/svelte/icons/folder-tree';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { deleteCategories } from '$lib/product-categories/api.js';
	import type { ProductCategory } from '$lib/product-categories/types.js';

	import { client } from '$lib/client';


	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client['product-categories'].get({ query: paginationQuery });
		},
		['product-categories']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rows = $derived(
		(paginateState.query.data?.data?.rows as ProductCategory[] | undefined)?.map((c) => ({
			...c,
			handle_display: getHandle(c)
		})) ?? []
	);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	function getHandle(category: ProductCategory): string {
		const h = category.handle;
		if (h) return h.startsWith('/') ? h : `/${h}`;
		return `/${category.value.toLowerCase().replace(/\s+/g, '-')}`;
	}
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const categories = $derived(rows);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const formSheetOpen = $derived(paginateState.formSheetOpen);
	const refetch = $derived(paginateState.refetch);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);

	const tableColumns: TableColumn[] = [
		{
			label: 'Name',
			key: 'value',
			type: 'link',
			cellHref: (row) => `/products/categories/${row.id}`,
			textKey: 'value'
		},
		{ label: 'Handle', key: 'handle_display', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Visibility', key: 'visibility', type: 'text' },
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
	<title>Categories | Products | Danimai Store</title>
	<meta name="description" content="Manage product categories." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<FolderTree class="size-4" />
				<span class="font-semibold">Categories</span>
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
							emptyMessage="No categories found."
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

<CategoryFormSheet
	bind:open={paginateState.formSheetOpen}
	mode={formMode}
	category={formItem as ProductCategory | null}
	onSuccess={refetch}
/>

<!-- Delete Confirmation Modal -->
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="category"
	entityTitle={(deleteItem as unknown as ProductCategory)?.value ?? (deleteItem as unknown as ProductCategory)?.id ?? ''}
	customMessage="Delete this category? This action cannot be undone."
	onConfirm={() => confirmDelete((item) => deleteCategories([(item as any).id]))}
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
