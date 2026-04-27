<script lang="ts">
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

	import Globe from '@lucide/svelte/icons/globe';
	import { client } from '$lib/client.js';
	import { createPaginationState } from '$lib/api/pagination.svelte.js';
	import type { PageProps } from './$types';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { goto, invalidateAll } from '$app/navigation';
	// import CreateRegion from '$lib/components/organs/region/create/create-region.svelte';
	const { data }: PageProps = $props();

	async function refetch() {
		await invalidateAll();
	}
	const paginateState = createPaginationState<
		NonNullable<NonNullable<typeof data.regions>['rows']>[number]
	>(() => {
		refetch();
	});
	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	function openRegionDetails(region: { id: string }) {
		goto(resolve(`/regions/${region.id}`, {}));
	}

	const rows = $derived(data.regions?.rows ?? []);
	const pagination = $derived(data.regions?.pagination ?? null);
	const start = $derived(data.regions?.pagination.start ?? 0);
	const end = $derived(data.regions?.pagination.end ?? 0);

	// const closeForm = $derived(paginateState.closeForm);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);

	// let createSheetOpen = $state(false);

	function openCreateSheet() {
		// createSheetOpen = true;
	}
	// async function handleFormSaved() {
	// 	paginateState.closeForm();
	// 	refetch();
	// }
	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Currency', key: 'currency_code', type: 'text' },
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
					onClick: (item) => openRegionDetails(item as { id: string })
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as Parameters<typeof openDeleteConfirm>[0])
				}
			]
		}
	];
	async function deleteRegions(ids: string[]) {
		const res = await client['regions'].delete({ ids });
		if (res?.error) {
			throw new Error(String(res.error.value?.message ?? 'Failed to delete region'));
		}
		refetch();
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Globe class="size-4" />
				<span class="font-semibold">Regions</span>
			</div>
			<Button size="sm" onclick={openCreateSheet}>Create</Button>
		</div>
		<PaginationTable>
			<div class="min-h-0 flex-1 overflow-auto rounded-lg border bg-card">
				<table class="w-full text-sm">
					<TableHead columns={tableColumns} />
					<TableBody
						{rows}
						columns={tableColumns}
						emptyMessage="No regions found."
						onRowClick={(row) => openRegionDetails(row as { id: string })}
					/>
				</table>
			</div>
		</PaginationTable>
		<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
	</div>
</div>

<!-- <CreateRegion open={createSheetOpen} onSuccess={handleFormSaved} /> -->

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="region"
	entityTitle={String(
		(deleteItem as Record<string, unknown>)?.name ??
			(deleteItem as Record<string, unknown>)?.id ??
			''
	)}
	onConfirm={() => confirmDelete((r: unknown) => deleteRegions([(r as { id: string }).id]))}
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
