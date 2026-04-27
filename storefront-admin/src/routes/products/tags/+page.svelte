<script lang="ts">
	import { page } from '$app/state';
	import { resolve } from '$app/paths';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TagFormSheet,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';

	import Tag from '@lucide/svelte/icons/tag';
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
		NonNullable<NonNullable<typeof data.tags>['rows']>[number]
	>(() => {
		refetch();
	});
	// const { query } = paginateState;
	const rows = $derived(data.tags?.rows ?? []);
	type TagRow = (typeof rows)[number];

	const pagination = $derived(data.tags?.pagination ?? null);
	const start = $derived(data.tags?.pagination?.start ?? 0);
	const end = $derived(data?.tags?.pagination?.end ?? 0);

	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const deleteItem = $derived(paginateState.deleteItem);

	const openCreate = $derived(paginateState.openCreate);

	async function handleFormSaved() {
		paginateState.closeForm();
		refetch();
	}

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}
	const tableColumns: TableColumn<TagRow>[] = [
		{
			label: 'Value',
			key: 'value',
			type: 'link',
			cellHref: (row) => resolve(`/products/tags/${String(row.id ?? '')}`, {}),
			textKey: 'value'
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
					onClick: (item) => goto(resolve(`/products/tags/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => (openDeleteConfirm as unknown as (row: TagRow) => void)(item as TagRow)
				}
			]
		}
	];
</script>

<svelte:head>
	<title>Tags | Products | Danimai Store</title>
	<meta name="description" content="Manage product tags." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Tag class="size-4" />
				<span class="font-semibold">Tags</span>
			</div>
			<Button size="sm" onclick={openCreate}>Create</Button>
		</div>

		<PaginationTable>
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<TableHead columns={tableColumns} />
					<TableBody {rows} columns={tableColumns as TableColumn[]} emptyMessage="No tags found." />
				</table>
			</div>

			<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
		</PaginationTable>
	</div>
</div>

<TagFormSheet
	bind:open={paginateState.formSheetOpen}
	formData={data.tagCreateForm.data as { value: string }}
	onSuccess={handleFormSaved}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="tag"
	entityTitle={(deleteItem as TagRow | null)?.value ?? (deleteItem as TagRow | null)?.id ?? ''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as TagRow;
			await client['product-tags'].delete({ tag_ids: [row.id] });
			toast.success('Tag deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
