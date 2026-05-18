<script lang="ts">
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
	import { client } from '$lib/client.js';

	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { createPaginationState } from '$lib/api';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
	const refetch = $derived(() => {
		invalidateAll();
	});
	const paginateState = createPaginationState<
		NonNullable<NonNullable<typeof data.collections>['rows']>[number]
	>(() => {
		refetch();
	});

	const rows = $derived(data.collections?.rows ?? []);
	type CollectionRow = (typeof rows)[number];

	const pagination = $derived(data.collections?.pagination ?? null);
	const start = $derived(data.collections?.pagination?.start ?? 0);
	const end = $derived(data?.collections?.pagination?.end ?? 0);

	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const deleteItem = $derived(paginateState.deleteItem);
	async function handleFormSaved() {
		paginateState.closeForm();
		refetch();
	}
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
			<Button size="sm" onclick={openCreateSheet}>Create</Button>
		</div>
		<PaginationTable>
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
		</PaginationTable>
	</div>
</div>

<CollectionFormSheet bind:open={createSheetOpen} onSuccess={handleFormSaved} />

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
