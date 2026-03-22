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
		CollectionFormSheet
	} from '$lib/components/organs/index.js';
	import FileText from '@lucide/svelte/icons/file-text';
	import GripVertical from '@lucide/svelte/icons/grip-vertical';
	import { client } from '$lib/client.js';
	import { createPagination, createPaginationQuery } from '$lib/api';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => client['collections'].get({ query: paginationQuery }),
		['collections'],
		paginationQuery
	);

	const { query } = paginateState;

	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);
	const rows = $derived(query.data?.data?.rows ?? []);
	type CollectionRow = (typeof rows)[number];

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
	const rowsForTable = $derived(
		rows.map((c) => ({
			...c,
			handle_display: c.handle.startsWith('/') ? c.handle : `/${c.handle}`
		}))
	);

	const tableColumns: TableColumn<CollectionRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => resolve(`/products/collections/${String(row.id ?? '')}`, {}),
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
					onClick: (item) => goto(resolve(`/products/collections/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						(openDeleteConfirm as unknown as (row: CollectionRow) => void)(item as CollectionRow)
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
							emptyMessage="No collections found."
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<CollectionFormSheet
	bind:open={createSheetOpen}
	onSuccess={() => {
		void query.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="collection"
	entityTitle={(deleteItem as CollectionRow | null)?.title ??
		(deleteItem as CollectionRow | null)?.handle ??
		(deleteItem as CollectionRow | null)?.id ??
		''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as CollectionRow;
			await client['collections'].delete({ collection_ids: [row.id] });
			toast.success('Collection deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
