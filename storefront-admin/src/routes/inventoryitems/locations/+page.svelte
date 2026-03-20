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
	import MapPin from '@lucide/svelte/icons/map-pin';
	import CreateLocation from '$lib/components/organs/location/create/CreateLocation.svelte';
	import UpdateLocation from '$lib/components/organs/location/update/UpdateLocation.svelte';
	import { client } from '$lib/client.js';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';

	let { data }: { data: PageData } = $props();

	type StockLocationAddress = {
		address_1?: string | null;
		address_2?: string | null;
		company?: string | null;
		city?: string | null;
		province?: string | null;
		postal_code?: string | null;
		country_code?: string | null;
		phone?: string | null;
	};

	type StockLocationRow = {

		id: string;
		
		name: string | null;
		address?: StockLocationAddress | null;
		created_at: string;
		updated_at: string;
	};

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => {
			return client['stock-locations'].get({ query: paginationQuery });
		},
		['stock-locations']
	);

	function goToPage(pageNum: number) {
		const params = new URLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(`${page.url.pathname}?${params.toString()}`, { replaceState: true });
	}

	function formatAddress(addr: StockLocationAddress | null | undefined): string {
		if (!addr) return '–';
		const parts = [
			addr.address_1,
			addr.address_2,
			[addr.city, addr.province].filter(Boolean).join(', '),
			addr.postal_code,
			addr.country_code,
			addr.company
		].filter(Boolean);
		return parts.length ? parts.join(' · ') : '–';
	}

	const rows = $derived(
		(paginateState.query.data?.data?.rows ?? []) as unknown as StockLocationRow[]
	);
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

	const rowsForTable = $derived(
		(rows as StockLocationRow[]).map((loc) => ({
			...loc,
			address_display: formatAddress(loc.address),
			phone_display: loc.address?.phone ?? '–'
		}))
	);

	async function deleteStockLocations(ids: string[]) {
		const res = await client['stock-locations'].delete({ ids });
		if (res?.error) {
			const err = res.error as { value?: { message?: string } };
			throw new Error(String(err.value?.message ?? 'Failed to delete location'));
		}
	}

	const tableColumns: TableColumn[] = [
		{ label: 'Name', key: 'name', type: 'text' },
		{ label: 'Address', key: 'address_display', type: 'text' },
		{ label: 'Phone', key: 'phone_display', type: 'text' },
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
					onClick: (item) => openEdit(item as Parameters<typeof openEdit>[0])
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
	<title>Locations | Inventory | Danimai Store</title>
	<meta name="description" content="Manage locations." />
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<MapPin class="size-4" />
				<span class="font-semibold">Locations</span>
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
							rows={rowsForTable}
							columns={tableColumns}
							emptyMessage="No locations found."
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

{#if formMode === 'create'}
	<CreateLocation
		bind:open={paginateState.formSheetOpen}
		stockLocationForm={data.stockLocationForm}
		onSuccess={() => {
			void refetch();
		}}
	/>
{:else if formItem}
	<UpdateLocation
		bind:open={paginateState.formSheetOpen}
		stockLocationForm={data.stockLocationForm}
		// location={formItem as StockLocationRow}
		onSuccess={() => {
			void refetch();
		}}
	/>
{/if}

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="location"
	entityTitle={(deleteItem as any)?.name ?? (deleteItem as any)?.id ?? ''}
	onConfirm={() => confirmDelete((loc) => deleteStockLocations([(loc as any).id]))}
	onCancel={closeDeleteConfirm}
	submitting={deleteSubmitting}
	error={deleteError}
/>
