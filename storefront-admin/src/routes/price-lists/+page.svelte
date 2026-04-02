<script lang="ts">
	import type { PageData } from './$types';
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
	import { CreatePriceList, EditPriceList } from '$lib/components/organs/index.js';
	import ListChecks from '@lucide/svelte/icons/list-checks';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { client } from '$lib/client.js';

	let { data }: { data: PageData } = $props();

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	type PriceListRow = (typeof rows)[number];
	const paginateState = createPagination(async () => {
		return client['price-lists'].get({ query: paginationQuery });
	}, ['price-lists']);

	$effect(() => {
		page.url.searchParams.toString();
	});

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const rows = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const refetch = $derived(paginateState.refetch);

	function goToPriceListEdit(item: Parameters<typeof paginateState.openEdit>[0]) {
		const id = (item as { id?: string }).id;
		if (!id) return;
		goto(resolve(`/price-lists/${id}?edit=true`, {}));
	}

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
					onClick: (item) => goToPriceListEdit(item as Parameters<typeof paginateState.openEdit>[0])
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

	function goToPriceListDetails(row: PriceListRow) {
		goto(resolve(`/price-lists/${row.id}`, {}));
	}
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
							{rows}
							columns={tableColumns}
							emptyMessage="No price lists yet. Create one to define custom pricing (e.g. sales or overrides)."
							onRowClick={(row) => goToPriceListDetails(row as unknown as PriceListRow)}
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

{#if formMode === 'edit' && formItem}
	<EditPriceList
		bind:open={paginateState.formSheetOpen}
		priceListUpdateForm={data.priceListUpdateForm}
		list={formItem as unknown as PriceListRow}
		onSuccess={refetch}
	/>
{:else}
	<CreatePriceList
		bind:open={paginateState.formSheetOpen}
		priceListCreateForm={data.priceListCreateForm}
		onSuccess={refetch}
	/>
{/if}

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="price list"
	entityTitle={(deleteItem as PriceListRow | null)?.name ??
		(deleteItem as PriceListRow | null)?.id ??
		''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as PriceListRow;
			await client['price-lists'].delete({ ids: [row.id] });
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
