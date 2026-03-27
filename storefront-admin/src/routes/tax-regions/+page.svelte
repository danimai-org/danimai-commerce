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
	import TaxCreate from '$lib/components/organs/tax-region/create/taxCreate.svelte';
	import Receipt from '@lucide/svelte/icons/receipt';
	import {
		createPaginationQuery,
		createPagination,
		type PaginationMeta
	} from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client.js';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () =>
			client['tax-regions'].get({
				query: paginationQuery as Record<string, unknown>
			}),
		['tax-regions'],
		undefined,
		{ keySuffix: () => [page.url.searchParams.toString()] }
	);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	const queryData = $derived(
		paginateState.query.data as
			| { data?: { rows?: unknown[]; pagination?: PaginationMeta } }
			| undefined
	);
	const rows = $derived((queryData?.data?.rows ?? []) as Record<string, unknown>[]);
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);
	const openCreate = $derived(paginateState.openCreate);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteError = $derived(paginateState.deleteError);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);

	async function handleFormSaved() {
		paginateState.closeForm();
		await paginateState.refetch();
	}

	const tableColumns: TableColumn[] = [
		{
			label: 'Name',
			key: 'name',
			type: 'link',
			cellHref: (item) => `/tax-regions/${String((item as { id?: string }).id ?? '')}`
		},
		{ label: 'Tax provider', key: 'tax_provider_id', type: 'text' },
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
					onClick: (item) =>
						goto(resolve(`/tax-regions/${String((item as { id?: string }).id ?? '')}`, {}))
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
</script>

<svelte:head>
	<title>Tax Regions</title>
	<meta name="description" content="Manage tax regions." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Receipt class="size-4" />
				<span class="font-semibold">Tax Regions</span>
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
						<TableBody {rows} columns={tableColumns} emptyMessage="No tax regions found." />
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<TaxCreate bind:open={paginateState.formSheetOpen} mode="create" onSuccess={handleFormSaved} />

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="tax region"
	entityTitle={(deleteItem as { name?: string; id?: string } | null)?.name ??
		(deleteItem as { id?: string } | null)?.id ??
		''}
	onConfirm={() =>
		confirmDelete(async (item) => {
			const id = (item as { id?: string }).id;
			if (!id) throw new Error('Missing tax region id');
			await client['tax-regions'].delete({ tax_region_ids: [id] });
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
