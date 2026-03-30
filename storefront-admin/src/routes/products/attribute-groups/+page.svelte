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
		CreateAttributeGroupSheet,
		EditAttributeGroupSheet,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { createPagination, createPaginationQuery } from '$lib/api';
	import { client } from '$lib/client.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';

	const paginateState = createPagination(
		async () =>
			client['product-attribute-groups'].get({
				query: createPaginationQuery(page.url.searchParams)
			}),
		['product-attribute-groups'],
		createPaginationQuery(page.url.searchParams)
	);
	const { query } = paginateState;
	const refetch = $derived(paginateState.refetch);
	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);
	const rows = $derived(query.data?.data?.rows ?? []);
	type AttributeGroupRow = (typeof rows)[number];

	const pagination = $derived(query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const deleteItem = $derived(paginateState.deleteItem);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const tableColumns: TableColumn<AttributeGroupRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => resolve(`/products/attribute-groups/${String(row.id ?? '')}`, {}),
			textKey: 'title'
		},
		{ label: 'Created', key: 'created_at', type: 'date' },
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
					onClick: (item) => goto(resolve(`/products/attribute-groups/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						(openDeleteConfirm as unknown as (row: AttributeGroupRow) => void)(
							item as AttributeGroupRow
						)
				}
			]
		}
	];

	let createOpen = $state(false);
	let groupEditOpen = $state(false);

	let editGroup = $state<{
		id: string;
		title: string;
		attribute_ids: string[];
		required: boolean;
		rank: number;
	} | null>(null);
</script>

<svelte:head>
	<title>Attribute groups | Products | Danimai Store</title>
	<meta name="description" content="Manage product attribute groups." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListFilter class="size-4" />
				<span class="font-semibold">Attribute groups</span>
			</div>
			<Button size="sm" onclick={() => (createOpen = true)}>Create</Button>
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
							{rows}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No attribute groups found."
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<CreateAttributeGroupSheet
	bind:open={createOpen}
	onSuccess={() => {
		void refetch();
	}}
/>
<EditAttributeGroupSheet
	bind:open={groupEditOpen}
	group={editGroup}
	onSuccess={() => void refetch()}
	onClosed={() => {
		editGroup = null;
	}}
/>
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={(deleteItem as AttributeGroupRow | null)?.title ??
		(deleteItem as AttributeGroupRow | null)?.id ??
		''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as AttributeGroupRow;
			await client['product-attribute-groups'].delete({ attribute_group_ids: [row.id] });
			toast.success('Attribute group deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
