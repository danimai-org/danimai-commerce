<script lang="ts">
	import {
		DeleteConfirmationModal,
		DetailProductsCard,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import AddProductsSheet from './AddProductsSheet.svelte';
	import type { Product } from '$lib/components/organs/product/create/types.js';

	type ProductWithCollection = Product & {
		collection?: { id: string; title: string; handle: string } | null;
	};

	interface Props {
		categoryId: string | null;
		category: Record<string, unknown> | null;
		products: ProductWithCollection[];
		count: number;
		start: number;
		end: number;
		totalPages: number;
		currentPage: number;
		loading: boolean;
		paginationQuery: Record<string, string | number | undefined>;
		onProductsUpdated: () => void | Promise<void>;
		goToPage: (page: number) => void;
	}

	let {
		categoryId,
		category,
		products,
		count,
		start,
		end,
		totalPages,
		currentPage,
		loading,
		paginationQuery,
		onProductsUpdated,
		goToPage
	}: Props = $props();

	let addSheetOpen = $state(false);
	let search = $state('');

	const tableColumns: TableColumn[] = [
		{
			label: 'Product',
			key: 'title',
			type: 'link',
			cellHref: (row) => `/products/${row.id}`,
			thumbnailKey: 'thumbnail',
			textKey: 'title'
		},
		{ label: 'Collection', key: 'collection_display', type: 'text' },
		{ label: 'Sales Channels', key: 'sales_channels_display', type: 'text' },
		{ label: 'Variants', key: 'variants_count', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [
				{
					label: 'Remove from category',
					key: 'remove',
					type: 'button',
					onClick: (item) => openRemoveProductConfirm(item as ProductWithCollection)
				}
			]
		}
	];

	const rows = $derived(
		(products ?? [])
			.filter((product) => {
				const term = search.trim().toLowerCase();
				if (!term) return true;
				return product.title.toLowerCase().includes(term);
			})
			.map((product) => ({
				...product,
				collection_display: product.collection?.title ?? '—',
				sales_channels_display:
					product.sales_channels?.map((channel) => channel.name).join(', ') ?? '—',
				variants_count: product.variants?.length ?? product.variant_count ?? 0
			})) as Record<string, unknown>[]
	);

	const pagination = $derived({
		page: currentPage,
		total: count,
		total_pages: totalPages,
		has_previous_page: currentPage > 1,
		has_next_page: currentPage < totalPages
	});

	let removeProductModalOpen = $state(false);
	let productToRemove = $state<ProductWithCollection | null>(null);
	let removeSubmitting = $state(false);
	let removeError = $state<string | null>(null);

	function openRemoveProductConfirm(product: ProductWithCollection) {
		productToRemove = product;
		removeError = null;
		removeProductModalOpen = true;
	}

	function closeRemoveProductConfirm() {
		if (!removeSubmitting) {
			removeProductModalOpen = false;
			productToRemove = null;
			removeError = null;
		}
	}

	async function confirmRemoveProduct() {
		if (!categoryId || !category || !productToRemove) return;
		removeSubmitting = true;
		removeError = null;
		try {
			await client.products({ id: productToRemove.id }).put({ category_id: '' });
			removeProductModalOpen = false;
			productToRemove = null;
			await onProductsUpdated();
		} catch (e) {
			removeError = e instanceof Error ? e.message : String(e);
		} finally {
			removeSubmitting = false;
		}
	}
</script>

<DetailProductsCard
	rows={rows}
	columns={tableColumns}
	emptyMessage="No products in this category."
	{loading}
	error={null}
	{pagination}
	{start}
	{end}
	onPageChange={goToPage}
	showAddButton={true}
	onAdd={() => (addSheetOpen = true)}
	showSortButton={true}
	showSortIconButton={true}
	showSearchInput={true}
	searchValue={search}
	onSearchChange={(value) => (search = value)}
/>

<AddProductsSheet
	bind:open={addSheetOpen}
	{categoryId}
	{paginationQuery}
	onSuccess={onProductsUpdated}
/>

<DeleteConfirmationModal
	bind:open={removeProductModalOpen}
	entityName="product"
	entityTitle={productToRemove?.title ?? productToRemove?.id ?? ''}
	customMessage="Remove this product from the category? The product will remain but will no longer be associated with this category."
	onConfirm={confirmRemoveProduct}
	onCancel={closeRemoveProductConfirm}
	submitting={removeSubmitting}
	error={removeError}
/>
