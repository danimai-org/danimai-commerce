<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn,
		AttributeFormSheet
	} from '$lib/components/organs/index.js';
	import EditAttribute from '$lib/components/organs/attribute/update/EditAttributeHero.svelte';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client';

	function openCreate() {
		paginateState.openCreate();
	}

	const tableColumns: TableColumn[] = [
	{
		label: 'Title',
		key: 'title',
		type: 'link',
		cellHref: (row) => `/products/attributes/${row.id}`
	},
		{ label: 'Type', key: 'type' },
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
					onClick: (item) => goto(`/products/attributes/${(item as any).id}`)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (row) =>
					(paginateState.openDeleteConfirm as unknown as (item: any) => void)(
						row as any
					)
				}
			]
		}
	];

	const paginationQuery = $derived.by(() => createPaginationQuery($page.url.searchParams));
	const paginateState = createPagination(
		async () => {
			
			return client['product-attributes'].get({ query: paginationQuery });
		},
		['product-attributes']
	);
	async function refetchAttributes() {
		await paginateState.refetch();
	}

	function goToPage(pageNum: number) {
		const params = new URLSearchParams($page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${$page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data as any | undefined);
	const rawRows = $derived(queryData?.data?.rows ?? []);
	const rows = $derived(rawRows as Record<string, unknown>[]);
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	
	function closeDeleteConfirm() {
		paginateState.closeDeleteConfirm();
	}
	async function deleteAttributes(ids: string[]): Promise<void> {
		await client['product-attributes'].delete({  attribute_ids: ids });
	}


	async function handleFormSaved() {
		paginateState.closeForm();
		await paginateState.refetch();
	}

	function handleEditClosed() {
		paginateState.closeForm();
	}

	
</script>

<svelte:head>
	<title>Attributes | Products | Danimai Store</title>
	<meta name="description" content="Manage product attributes." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<SlidersHorizontal class="size-4" />
				<span class="font-semibold">Attributes</span>
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
							emptyMessage="No attributes found."
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

<AttributeFormSheet
	bind:open={paginateState.formSheetOpen}
	mode={paginateState.formMode as 'create' | undefined}
	attribute={(paginateState.formItem as any) ?? null}
	onSuccess={handleFormSaved}
/>
<EditAttribute
	attribute={paginateState.formMode === 'edit' ? ((paginateState.formItem as any) ?? null) : null}
	onSaved={handleFormSaved}
	onClosed={handleEditClosed}
/>

<!-- Delete attribute confirmation -->
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="attribute"
	entityTitle={(paginateState.deleteItem as any | null)?.title || (paginateState.deleteItem as any | null)?.id || ''}
	onConfirm={() => paginateState.confirmDelete(async (item: any) => {
		await deleteAttributes([item.id]);
		await paginateState.refetch();	
	})}
	onCancel={closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
/>
