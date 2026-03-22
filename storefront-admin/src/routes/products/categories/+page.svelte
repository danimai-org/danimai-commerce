<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
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
	import { createPagination, createPaginationQuery } from '$lib/api';
	import { client } from '$lib/client.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => client['product-categories'].get({ query: paginationQuery }),
		['product-categories'],
		paginationQuery
	);

	const { query } = paginateState;

	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);
	const rows = $derived(query.data?.data?.rows ?? []);
	type CategoryRow = (typeof rows)[number];

	const pagination = $derived(query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const deleteItem = $derived(paginateState.deleteItem);

	let createSheetOpen = $state(false);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	function openCreateSheet() {
		createSheetOpen = true;
	}

	function getHandle(category: CategoryRow): string {
		const h = category.handle;
		if (h) return h.startsWith('/') ? h : `/${h}`;
		return `/${category.value.toLowerCase().replace(/\s+/g, '-')}`;
	}

	const rowsForTable = $derived(
		rows.map((c) => ({
			...c,
			handle_display: getHandle(c)
		}))
	);

	const tableColumns: TableColumn<CategoryRow>[] = [
		{
			label: 'Name',
			key: 'value',
			type: 'link',
			cellHref: (row) => resolve(`/products/categories/${String(row.id ?? '')}`, {}),
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
					onClick: (item) => goto(resolve(`/products/categories/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						(openDeleteConfirm as unknown as (row: CategoryRow) => void)(item as CategoryRow)
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
				<Button size="sm" onclick={openCreateSheet}>Create</Button>
			</div>
		</div>
		<PaginationTable>
			{#if error}
				<div
					class="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
				>
					{error}
				</div>
			{:else if loading}
				<div class="flex min-h-0 flex-1 items-center justify-center rounded-lg border bg-card">
					<p class="text-muted-foreground">Loading…</p>
				</div>
			{:else}
				<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
					<table class="w-full text-sm">
						<TableHead columns={tableColumns} />
						<TableBody
							rows={rowsForTable}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No categories found."
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<CategoryFormSheet
	bind:open={createSheetOpen}
	onSuccess={() => {
		void query.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="category"
	entityTitle={(deleteItem as CategoryRow | null)?.value ??
		(deleteItem as CategoryRow | null)?.id ??
		''}
	customMessage="Delete this category? This action cannot be undone."
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as CategoryRow;
			await client['product-categories'].delete({ category_ids: [row.id] });
			toast.success('Category deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
