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
		AttributeFormSheet
	} from '$lib/components/organs/index.js';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import { createPaginationState } from '$lib/api';
	import { client } from '$lib/client.js';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';
	import { goto, invalidateAll } from '$app/navigation';
	import type { PageProps } from './$types';
	const { data }: PageProps = $props();
	const refetch = $derived(() => {
		invalidateAll();
	});
	const paginateState = createPaginationState<
		NonNullable<NonNullable<typeof data.attributes>['rows']>[number]
	>(() => {
		refetch();
	});

	const rows = $derived(data.attributes?.rows ?? []);
	const pagination = $derived(data.attributes?.pagination ?? null);
	type AttributeRow = (typeof rows)[number];
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const start = $derived(data.attributes?.pagination?.start ?? 0);
	const end = $derived(data?.attributes?.pagination?.end ?? 0);
	const deleteItem = $derived(paginateState.deleteItem);
	const formMode = $derived(paginateState.formMode);
	const openCreate = $derived(paginateState.openCreate);
	async function handleFormSaved() {
		paginateState.closeForm();
		void refetch();
	}
	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}
	const tableColumns: TableColumn<AttributeRow>[] = [
		{
			label: 'Title',
			key: 'title',
			type: 'link',
			cellHref: (row) => resolve(`/products/attributes/${String(row.id ?? '')}`, {}),
			textKey: 'title'
		},
		{ label: 'Type', key: 'type', type: 'text' },
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
					onClick: (item) => goto(resolve(`/products/attributes/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						(openDeleteConfirm as unknown as (row: AttributeRow) => void)(item as AttributeRow)
				}
			]
		}
	];
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
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<TableHead columns={tableColumns} />
					<TableBody
						{rows}
						columns={tableColumns as TableColumn[]}
						emptyMessage="No attributes found."
					/>
				</table>
			</div>
			<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
		</PaginationTable>
	</div>
</div>
{#if formMode === 'create'}
	<AttributeFormSheet bind:open={paginateState.formSheetOpen} onSuccess={handleFormSaved} />
{/if}
<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="attribute"
	entityTitle={(deleteItem as AttributeRow | null)?.title ??
		(deleteItem as AttributeRow | null)?.id ??
		''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as AttributeRow;
			await client['product-attributes'].delete({ ids: [row.id] });
			toast.success('Attribute deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
