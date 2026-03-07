<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import { DeleteConfirmationModal, PaginationTable, SalesChannelFormSheet, TableHead, TableBody, TablePagination, type TableColumn } from '$lib/components/organs/index.js';
	import Share2 from '@lucide/svelte/icons/share-2';
	import { deleteSalesChannels } from '$lib/sales-channels/api.js';
	import { client } from '$lib/client.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client['sales-channels'].get({ query: paginationQuery });
		},
		['sales-channels']
	);


	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const rows = $derived(paginateState.query.data?.data?.rows ?? []);
	const pagination = $derived(paginateState.query.data?.data?.pagination ?? null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const formMode = $derived(paginateState.formMode);
	const formItem = $derived(paginateState.formItem);
	const openCreate = $derived(paginateState.openCreate);
	const openEdit = $derived(paginateState.openEdit);
	const closeForm = $derived(paginateState.closeForm);
	const deleteConfirmOpen = $derived(paginateState.deleteConfirmOpen);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const refetch = $derived(paginateState.refetch);

const tableColumns: TableColumn[] = [
	{ label: 'Name', key: 'name', type: 'text' },
	{ label: 'Description', key: 'description', type: 'text' },
	{ label: 'Default', key: 'is_default', type: 'boolean' },
	{ label: 'Created', key: 'created_at', type: 'date' },
	{ label: 'Updated', key: 'updated_at', type: 'date' },
	{
		label: 'Actions',
		key: 'actions',
		type: 'actions',
		actions: [
			{ label: 'Edit', key: 'edit', type: 'button', onClick: (item) => openEdit(item as Parameters<typeof openEdit>[0]) },
			{ label: 'Delete', key: 'delete', type: 'button', onClick: (item) => openDeleteConfirm(item as Parameters<typeof openDeleteConfirm>[0]) },
		],
	},
];
</script>

<svelte:head>
    <title>Sales Channels</title>
    <meta name="description" content="Manage sales channels." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Share2 class="size-4" />
				<span class="font-semibold">Sales Channels</span>
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
						emptyMessage="No sales channels found."
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

<SalesChannelFormSheet
	bind:open={paginateState.formSheetOpen}
	mode={formMode}
	channel={formItem as any}
	onSuccess={refetch}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="sales channel"
	entityTitle={(deleteItem as any)?.name ?? (deleteItem as any)?.id ?? ''}
	onConfirm={() => confirmDelete((ch: any) => deleteSalesChannels([ch.id]))}
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
