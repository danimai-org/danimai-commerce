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
		CreateAttributeGroupSheet,
		EditAttributeGroupSheet,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import ListFilter from '@lucide/svelte/icons/list-filter';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client';


	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));
	const paginateState = createPagination(
		async () => {
			
			return client['product-attribute-groups'].get({ query: paginationQuery });
		},
		['product-attribute-groups']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	const queryData = $derived(paginateState.query.data);
	const rows = $derived((queryData?.data?.rows ?? []) as Record<string, unknown>[]);
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);

	
	const tableColumns: TableColumn[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/attribute-groups/${row.id}`
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
					onClick: (item) => openEdit(item as any)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => paginateState.openDeleteConfirm(item as unknown as any)
				}
			]
		}
	];

	// Create sheet (local state)
	let createOpen = $state(false);

	let editGroup = $state<any | null>(null);

	function openEdit(grp: any) {
		editGroup = grp;
	}
</script>


<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<ListFilter class="size-4" />
				<span class="font-semibold">Attribute Groups</span>
			</div>
			<Button size="sm" onclick={() => (createOpen = true)}>Create</Button>
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
							emptyMessage="No attribute groups found."
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

<CreateAttributeGroupSheet
	bind:open={createOpen}
	on:created={() => paginateState.refetch()}
/>

<EditAttributeGroupSheet
	group={editGroup}
	onSaved={async () => {
		editGroup = null;
		await paginateState.refetch();
	}}
	onClosed={() => {
		editGroup = null;
	}}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="attribute group"
	entityTitle={(paginateState.deleteItem as unknown as any)?.title || (paginateState.deleteItem as unknown as any)?.id || ''}
	onConfirm={() => paginateState.confirmDelete(async (item: any) => {
		await client['product-attribute-groups'].delete({ attribute_group_ids: [item.id] });
		paginateState.refetch();
	})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
/>
{#if paginateState.deleteError}
	<div
		class="mt-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
	>
		{paginateState.deleteError}
	</div>
{/if}
