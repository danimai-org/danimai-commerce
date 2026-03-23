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
	import CreateLocation from '$lib/components/organs/location/create/CreateLocation.svelte';
	import MapPin from '@lucide/svelte/icons/map-pin';
	import { client } from '$lib/client.js';
	import { createPaginationQuery, createPagination } from '$lib/api';
	import { resolve } from '$app/paths';
	import { SvelteURLSearchParams } from 'svelte/reactivity';
	import { toast } from 'svelte-sonner';

	const paginationQuery = $derived.by(() => createPaginationQuery(page.url.searchParams));

	const paginateState = createPagination(
		async () => client['stock-locations'].get({ query: paginationQuery }),
		['stock-locations'],
		paginationQuery
	);

	const { query } = paginateState;

	const loading = $derived(paginateState.loading);
	const error = $derived(paginateState.error);
	const rows = $derived(query.data?.data?.rows ?? []);
	type LocationRow = (typeof rows)[number];

	const pagination = $derived(query.data?.data?.pagination ?? null);
	const start = $derived(
		pagination && pagination.total > 0 ? (pagination.page - 1) * pagination.limit + 1 : 0
	);
	const end = $derived(
		pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0
	);

	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const deleteItem = $derived(paginateState.deleteItem);

	let createSheetOpen = $state(false);

	function goToPage(pageNum: number) {
		const params = new SvelteURLSearchParams(page.url.searchParams);
		params.set('page', String(Math.max(1, pageNum)));
		goto(resolve(`${page.url.pathname}?${params.toString()}`, {}), { replaceState: true });
	}

	function openCreateSheet() {
		createSheetOpen = true;
	}

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

	const rowsForTable = $derived(
		rows.map((loc) => ({
			...loc,
			address_display: formatAddress(loc.address),
			phone_display: loc.address?.phone ?? '–'
		}))
	);

	const tableColumns: TableColumn<LocationRow>[] = [
		{
			label: 'Name',
			key: 'name',
			type: 'link',
			cellHref: (row) => resolve(`/inventoryitems/locations/${String(row.id ?? '')}`, {}),
			textKey: 'name'
		},
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
					onClick: (item) => goto(resolve(`/inventoryitems/locations/${item.id}`, {}))
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) =>
						(openDeleteConfirm as unknown as (row: LocationRow) => void)(item as LocationRow)
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
			<Button size="sm" onclick={openCreateSheet}>Create</Button>
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
							rows={rowsForTable}
							columns={tableColumns as TableColumn[]}
							emptyMessage="No locations found."
						/>
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={goToPage} />
			{/if}
		</PaginationTable>
	</div>
</div>

<CreateLocation
	bind:open={createSheetOpen}
	onSuccess={() => {
		void query.refetch();
	}}
/>

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="location"
	entityTitle={(deleteItem as LocationRow | null)?.name ??
		(deleteItem as LocationRow | null)?.id ??
		''}
	onConfirm={() =>
		paginateState.confirmDelete(async (item) => {
			const row = item as unknown as LocationRow;
			const res = await client['stock-locations'].delete({ ids: [row.id] });
			if (res?.error) {
				const err = res.error as { value?: { message?: string } };
				throw new Error(String(err.value?.message ?? 'Failed to delete location'));
			}
			toast.success('Location deleted successfully');
		})}
	onCancel={paginateState.closeDeleteConfirm}
	submitting={paginateState.deleteSubmitting}
	error={paginateState.deleteError}
/>
