<script lang="ts">
	import { goto } from '$app/navigation';
	import { page} from '$app/state';
	import { Button } from '$lib/components/ui/button/index.js';
	import {
		DeleteConfirmationModal,
		PaginationTable,
		TableHead,
		TableBody,
		TablePagination,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import Package from '@lucide/svelte/icons/package';
	import { createPaginationQuery, createPagination } from '$lib/api/pagination.svelte.js';
	import type { Product, ProductsListResponse } from '$lib/products/types.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import { client } from '$lib/client.js';
	import CreateProductModal from '$lib/products/CreateProductModal.svelte';
	import { SvelteURLSearchParams,  } from 'svelte/reactivity';
	import {untrack} from "svelte"

	const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8000/admin';

	async function deleteProducts(ids: string[]): Promise<void> {
		const res = await fetch(`${API_BASE}/products`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ product_ids: ids })
		});
		if (!res.ok) {
			const text = await res.text();
			throw new Error(text || `HTTP ${res.status}`);
		}
	}

	let createOpen = $state(false);

	const paginationQuery = createPaginationQuery(page.url.searchParams);

	const paginateState = createPagination(
		async () => {
			return client.products.get({ query: paginationQuery });
		},
		['products'],
		paginationQuery
	);

	const queryData = $derived(paginateState.query.data as ProductsListResponse | undefined);
	const rawRows = $derived(queryData?.data?.rows ?? []);
	const rows = $derived(
		rawRows.map((p: Product) => ({
			...p,
			category_display: p.category?.name ?? p.category?.value ?? '—',
			sales_channels_display: p.sales_channels?.map((sc) => sc.name).join(', ') ?? '—',
			variants_count: p.variant_count ?? p.variants?.length ?? 0
		}))
	) as Record<string, unknown>[];
	const pagination = $derived((queryData?.data?.pagination ?? null) as PaginationMeta | null);
	const start = $derived(paginateState.start);
	const end = $derived(paginateState.end);
	const openDeleteConfirm = $derived(paginateState.openDeleteConfirm);
	const closeDeleteConfirm = $derived(paginateState.closeDeleteConfirm);
	const confirmDelete = $derived(paginateState.confirmDelete);
	const deleteItem = $derived(paginateState.deleteItem);
	const deleteSubmitting = $derived(paginateState.deleteSubmitting);
	const deleteError = $derived(paginateState.deleteError);
	const refetch = $derived(paginateState.refetch);
	const searchText = $derived(paginateState.searchText);

	function goWithParams(params: Record<string, string>) {
		const searchParams = untrack(() => new SvelteURLSearchParams(page.url.searchParams));

		Object.entries(params).forEach(([key, value]) => {
			searchParams.set(key, value);
		});

		// eslint-disable-next-line svelte/no-navigation-without-resolve
		goto(`?${searchParams.toString()}`, { replaceState: true, keepFocus: true});
	}

	const tableColumns: TableColumn[] = [
		{
			label: 'Product',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/${row.id}`,
			thumbnailKey: 'thumbnail',
			textKey: 'title'
		},
		{ label: 'Category', key: 'category_display', type: 'text' },
		{
			label: 'Inventory',
			key: 'id',
			type: 'link',
			cellHref: (row) => `/products/${row.id}`,
			linkLabel: 'View'
		},
		{ label: 'Sales Channels', key: 'sales_channels_display', type: 'text' },
		{ label: 'Variants', key: 'variants_count', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Edit',
					key: 'edit',
					type: 'button',
					onClick: (item) => goto(`/products/${item.id}`)
				},
				{
					label: 'Delete',
					key: 'delete',
					type: 'button',
					onClick: (item) => openDeleteConfirm(item as unknown as ProductsListResponse)
				}
			]
		}
	];

	function handleSearchChange(search: string) {
		paginateState.searchText = search;
		goWithParams({ search });
	}

	$effect(() => {
		console.log('searchText', searchText);
		handleSearchChange(paginateState.searchText);
	});

</script>
<svelte:head>
	<title>Products | Danimai Admin</title>
</svelte:head>

<div class="flex h-full flex-col">
	<div class="flex min-h-0 flex-1 flex-col p-6">
		<div class="mb-4 flex items-center justify-between border-b pb-4 pl-10">
			<div class="flex items-center gap-2">
				<Package class="size-4" />
				<span class="font-semibold">Products</span>
			</div>
			<Button size="sm" onclick={() => (createOpen = true)}>Create</Button>
		</div>
		<PaginationTable 
		bind:searchQuery={paginateState.searchText} 
		searchPlaceholder="Search products"
		>
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
						<TableBody {rows} columns={tableColumns} emptyMessage="No products found." />
					</table>
				</div>

				<TablePagination {pagination} {start} {end} onPageChange={(page) => goWithParams({ page: String(page) })} />
			{/if}
		</PaginationTable>
	</div>
</div>

<CreateProductModal bind:open={createOpen} onSuccess={() => refetch()} />

<DeleteConfirmationModal
	bind:open={paginateState.deleteConfirmOpen}
	entityName="product"
	entityTitle={(deleteItem as unknown as Product | null)?.title ??
		(deleteItem as unknown as Product | null)?.handle ??
		(deleteItem as unknown as Product | null)?.id ??
		''}
	onConfirm={() => confirmDelete((p) => deleteProducts([(p as unknown as Product).id]))}
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
