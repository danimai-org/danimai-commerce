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
		type TableColumn
	} from '$lib/components/organs/index.js';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { client } from '$lib/client.js';
	import { createPaginationState } from '$lib/api/pagination.svelte.js';
	import type { PageProps } from './$types';
	import { invalidateAll } from '$app/navigation';
	// import { CreatePriceList } from '$lib/components/organs/index.js';
	const { data }: PageProps = $props();

	const refetch = $derived(() => {
		invalidateAll();
	});

	const paginateState = createPaginationState<
		NonNullable<NonNullable<typeof data.priceLists>['rows']>[number]
	>(() => {
		refetch();
	});

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	// function goToPriceListEdit(item: Parameters<typeof paginateState.openEdit>[0]) {
	// 	const id = (item as { id?: string }).id;
	// 	if (!id) return;
	// 	goto(resolve(`/price-lists/${id}?edit=true`, {}));
	// }

	const rows = $derived(data?.priceLists?.rows ?? []);
	const pagination = $derived(data?.priceLists?.pagination ?? null);
	const start = $derived(data?.priceLists?.pagination?.start ?? 0);
	const end = $derived(data?.priceLists?.pagination?.end ?? 0);
	const openCreate = $derived(paginateState.openCreate);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Type', key: 'type', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{ label: 'Starts', key: 'starts_at', type: 'date' },
		{ label: 'Ends', key: 'ends_at', type: 'date' },
		{ label: 'Created', key: 'created_at', type: 'date' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',

			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) =>
						goto(resolve(`/price-lists/${String((item as { id?: string }).id ?? '')}`, {}), {
							replaceState: true
						})
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						paginateState.openDeleteConfirm(
							item as Parameters<typeof paginateState.openDeleteConfirm>[0]
						)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Price Lists | Danimai Store</title>
	<meta name="description" content="Manage price lists." />
</svelte:head>
<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListChecks class="size-4" />
				<span class="font-semibold">Price Lists</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>
		<PaginationTable>
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<TableHead columns={tableColumns} />
					<TableBody
						{rows}
						columns={tableColumns}
						emptyMessage="No price lists yet. Create one to define custom pricing (e.g. sales or overrides)."
					/>
				</table>
			</div>
			<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
		</PaginationTable>
	</div>
</div>

<!-- <CreatePriceList  bind:open={paginateState.formSheetOpen} onSuccess={refetch} /> -->

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="price list"
	entityTitle={String(deleteItem?.name ?? deleteItem?.id ?? '')}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			await client['price-lists'].delete({ ids: [item.id] });
			refetch();
		})}
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
