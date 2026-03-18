<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import {
		DeleteConfirmationModal,
		DetailProductsCard,
		type TableColumn
	} from '$lib/components/organs/index.js';
	import { client } from '$lib/client.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';
	import type { Product } from '$lib/components/organs/product/create/types.js';

	type TagProduct = Product & {
		collection?: { id: string; title: string; handle: string } | null;
	};

	interface Props {
		tagId: string | null;
		products: TagProduct[];
		pagination: PaginationMeta | null;
		start: number;
		end: number;
		onPageChange: (page: number) => void;
		onProductsUpdated?: () => void | Promise<void>;
		loading?: boolean;
	}

	let {
		tagId,
		products,
		pagination,
		start,
		end,
		onPageChange,
		onProductsUpdated = () => {},
		loading = false
	}: Props = $props();

	let search = $state('');
	let addSheetOpen = $state(false);
	let addList = $state<TagProduct[]>([]);
	let addSearch = $state('');
	let addSelectedIds = $state<Set<string>>(new Set());
	let addSubmitting = $state(false);
	let addError = $state<string | null>(null);
	let removeProductModalOpen = $state(false);
	let productToRemove = $state<TagProduct | null>(null);
	let removeSubmitting = $state(false);
	let removeError = $state<string | null>(null);

	const tableColumns: TableColumn[] = [
		{ label: 'Product', key: 'title', type: 'link', cellHref: (row) => `/products/${row.id}`, thumbnailKey: 'thumbnail', textKey: 'title' },
		{ label: 'Collection', key: 'collection_display', type: 'text' },
		{ label: 'Sales Channels', key: 'sales_channels_display', type: 'text' },
		{ label: 'Variants', key: 'variants_count', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' },
		{
			label: 'Actions',
			key: 'actions',
			type: 'actions',
			actions: [{ label: 'Remove from tag', key: 'remove', type: 'button', onClick: (item) => openRemoveProductConfirm(item as TagProduct) }]
		}
	];

	const rows = $derived(
		(products ?? [])
			.filter((p) => p.title.toLowerCase().includes(search.trim().toLowerCase()))
			.map((p) => ({
				...p,
				collection_display: p.collection?.title ?? '—',
				sales_channels_display: p.sales_channels?.map((sc) => sc.name).join(', ') ?? '—',
				variants_count: p.variant_count ?? p.variants?.length ?? 0
			})) as Record<string, unknown>[]
	);

	const filteredAddList = $derived(
		addSearch.trim()
			? addList.filter((p) => p.title.toLowerCase().includes(addSearch.trim().toLowerCase()))
			: addList
	);

	$effect(() => {
		if (!addSheetOpen) return;
		addSelectedIds = new Set();
		addSearch = '';
		addError = null;
		void loadAddList();
	});

	async function loadAddList() {
		try {
			const res = await client.products.get({ query: { page: 1, limit: 100 } });
			const data = res.data as { data?: { rows: TagProduct[] } };
			addList = data?.data?.rows ?? [];
		} catch {
			addList = [];
		}
	}

	function toggleAddSelection(id: string) {
		const next = new Set(addSelectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		addSelectedIds = next;
	}

	function openRemoveProductConfirm(product: TagProduct) {
		productToRemove = product;
		removeError = null;
		removeProductModalOpen = true;
	}

	function closeRemoveProductConfirm() {
		if (removeSubmitting) return;
		removeProductModalOpen = false;
		productToRemove = null;
		removeError = null;
	}

	async function confirmRemoveProduct() {
		if (!tagId || !productToRemove) return;
		removeSubmitting = true;
		removeError = null;
		try {
			const res = await (client as any)['product-tags']({ id: tagId }).products.delete({
				product_ids: [productToRemove.id]
			});
			if (res.error) {
				removeError = String(res.error);
				return;
			}
			removeProductModalOpen = false;
			productToRemove = null;
			await onProductsUpdated();
		} catch (e) {
			removeError = e instanceof Error ? e.message : String(e);
		} finally {
			removeSubmitting = false;
		}
	}

	async function submitAdd() {
		if (!tagId || addSelectedIds.size === 0) return;
		addSubmitting = true;
		addError = null;
		try {
			const res = await (client as any)['product-tags']({ id: tagId }).products.post({
				product_ids: Array.from(addSelectedIds)
			});
			if (res.error) {
				addError = String(res.error);
				return;
			}
			addSheetOpen = false;
			await onProductsUpdated();
		} catch (e) {
			addError = e instanceof Error ? e.message : String(e);
		} finally {
			addSubmitting = false;
		}
	}
</script>

<DetailProductsCard
	rows={rows}
	columns={tableColumns}
	emptyMessage="No products with this tag."
	{loading}
	error={null}
	{pagination}
	{start}
	{end}
	onPageChange={onPageChange}
	showAddButton={true}
	onAdd={() => (addSheetOpen = true)}
	showSearchInput={true}
	searchValue={search}
	onSearchChange={(value) => (search = value)}
/>

<Sheet.Root bind:open={addSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-4xl sm:max-w-4xl">
		<div class="flex h-full flex-col">
			<div class="border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Add products</h2>
				<p class="mt-1 text-sm text-muted-foreground">Select products to add to this tag.</p>
			</div>
			<div class="flex min-h-0 flex-1 flex-col">
				<div class="border-b px-6 py-4">
					<div class="relative w-48">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input type="search" placeholder="Search" bind:value={addSearch} class="h-9 rounded-md pl-9" />
					</div>
				</div>
				<div class="min-h-0 flex-1 overflow-auto px-6">
					{#if filteredAddList.length === 0}
						<p class="py-8 text-center text-muted-foreground">No products to show.</p>
					{:else}
						{#each filteredAddList as p (p.id)}
							<label class="flex items-center gap-3 border-b py-3">
								<input type="checkbox" checked={addSelectedIds.has(p.id)} onchange={() => toggleAddSelection(p.id)} />
								{#if p.thumbnail}
									<img src={p.thumbnail} alt="" class="size-10 rounded-md object-cover" />
								{:else}
									<div class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground">
										<ImageIcon class="size-5" />
									</div>
								{/if}
								<span class="font-medium">{p.title}</span>
							</label>
						{/each}
					{/if}
				</div>
			</div>
			{#if addError}<p class="px-6 pb-2 text-sm text-destructive">{addError}</p>{/if}
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (addSheetOpen = false)}>Cancel</Button>
				<Button onclick={submitAdd} disabled={addSubmitting}>{addSubmitting ? 'Saving…' : 'Save'}</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

<DeleteConfirmationModal
	bind:open={removeProductModalOpen}
	entityName="product"
	entityTitle={productToRemove?.title ?? productToRemove?.id ?? ''}
	customMessage="Remove this product from the tag? The product will remain but will no longer be associated with this tag."
	onConfirm={confirmRemoveProduct}
	onCancel={closeRemoveProductConfirm}
	submitting={removeSubmitting}
	error={removeError}
/>
