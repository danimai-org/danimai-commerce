<script lang="ts">
	import { DetailProductsCard, type TableColumn } from '$lib/components/organs/index.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import Search from '@lucide/svelte/icons/search';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { client } from '$lib/client.js';
	import type { PaginationMeta } from '$lib/api/pagination.svelte.js';

	type TagProduct = any & {
		collection?: { id: string; title: string; handle: string } | null;
	};

	interface Props {
		tagId: string | null;
		products: any[];
		pagination: any | null;
		start: number;
		end: number;
		onPageChange: (page: number) => void;
		onProductsUpdated?: () => void | Promise<void>;
	}

	let {
		tagId,
		products,
		pagination,
		start,
		end,
		onPageChange,
		onProductsUpdated = () => {}
	}: Props = $props();

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
		{ label: 'Variants', key: 'variants_display', type: 'text' },
		{ label: 'Status', key: 'status', type: 'text' }
	];

	const rows = $derived(
		(products ?? []).map((p) => {
			const withCollection = p as TagProduct;
			const variantsCount = withCollection.variants?.length ?? 0;
			return {
				...withCollection,
				collection_display: withCollection.collection?.title ?? '—',
				sales_channels_display:
					withCollection.sales_channels?.map((sc: any) => sc.name).join(', ') ?? '—',
				variants_display: `${variantsCount} variant${variantsCount === 1 ? '' : 's'}`
			} as Record<string, unknown>;
		})
	);

	let addSheetOpen = $state(false);
	let addListData = $state<{ rows: any[]; pagination: PaginationMeta } | null>(null);
	let addPage = $state(1);
	let addLimit = $state(20);
	let addSearch = $state('');
	let addSelectedIds = $state<Set<string>>(new Set());
	let addSubmitting = $state(false);
	let addError = $state<string | null>(null);

	const addList = $derived(addListData?.rows ?? []);
	const addPagination = $derived(addListData?.pagination ?? null);
	const addCount = $derived(addPagination?.total ?? 0);
	const addTotalPages = $derived(addPagination?.total_pages ?? 1);
	const addStart = $derived(addPagination ? (addPagination.page - 1) * addPagination.limit + 1 : 0);
	const addEnd = $derived(
		addPagination ? Math.min(addPagination.page * addPagination.limit, addCount) : 0
	);
	const addFiltered = $derived(
		addSearch.trim()
			? addList.filter((p) => p.title.toLowerCase().includes(addSearch.trim().toLowerCase()))
			: addList
	);

	async function loadAddList() {
		try {
			const res = await client.products.get({
				query: {
					page: addPage,
					limit: addLimit
				}
			});
			const data = res.data as { data?: { rows: any[]; pagination: PaginationMeta } };
			addListData = data?.data ?? null;
		} catch {
			addListData = null;
		}
	}

$effect(() => {
	if (!addSheetOpen) return;
	addSelectedIds = new Set();
	addPage = 1;
	addSearch = '';
	addError = null;
});

$effect(() => {
	if (!addSheetOpen) return;
	addPage;
	addLimit;
	loadAddList();
});

	function toggleAddSelection(id: string) {
		addSelectedIds = new Set(addSelectedIds);
		if (addSelectedIds.has(id)) addSelectedIds.delete(id);
		else addSelectedIds.add(id);
		addSelectedIds = new Set(addSelectedIds);
	}

	function toggleAddSelectAll() {
		if (addSelectedIds.size === addFiltered.length) {
			addSelectedIds = new Set();
		} else {
			addSelectedIds = new Set(addFiltered.map((p) => p.id));
		}
	}

	async function submitAdd() {
		if (!tagId || addSelectedIds.size === 0) return;
		const ids = Array.from(addSelectedIds);
		if (ids.length === 0) {
			addError = 'Select at least one product';
			return;
		}

		addError = null;
		addSubmitting = true;
		try {
			const res = await (client as any)['product-tags']({ id: tagId }).products.post({
				product_ids: ids
			});
			if (res.error) {
				const err = res.error as { value?: { message?: string } };
				addError = err?.value?.message ?? String(res.error);
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
	loading={false}
	error={null}
	{pagination}
	{start}
	{end}
	onPageChange={onPageChange}
	showAddButton={true}
	onAdd={() => (addSheetOpen = true)}
/>

<Sheet.Root bind:open={addSheetOpen}>
	<Sheet.Content side="right" class="w-full max-w-4xl sm:max-w-4xl">
		<div class="flex h-full flex-col">
			<div class="shrink-0 border-b px-6 py-4">
				<h2 class="text-lg font-semibold">Add products</h2>
				<p class="mt-1 text-sm text-muted-foreground">Select products to add to this tag.</p>
			</div>
			<div class="flex min-h-0 flex-1 flex-col">
				<div class="flex items-center justify-between gap-4 border-b px-6 py-4">
					<div class="relative w-48">
						<Search class="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search"
							bind:value={addSearch}
							class="h-9 rounded-md pl-9"
						/>
					</div>
				</div>
				<div class="min-h-0 flex-1 overflow-auto px-6">
					<table class="w-full text-sm">
						<thead class="sticky top-0 z-10 border-b bg-muted/50">
							<tr>
								<th class="w-10 px-4 py-3 text-left font-medium">
									<input
										type="checkbox"
										class="rounded border-muted-foreground/50"
										aria-label="Select all"
										checked={addFiltered.length > 0 &&
											addSelectedIds.size === addFiltered.length}
										onchange={toggleAddSelectAll}
									/>
								</th>
								<th class="px-4 py-3 text-left font-medium">Product</th>
								<th class="px-4 py-3 text-left font-medium">Collection</th>
								<th class="px-4 py-3 text-left font-medium">Sales Channels</th>
								<th class="px-4 py-3 text-left font-medium">Variants</th>
								<th class="px-4 py-3 text-left font-medium">Status</th>
							</tr>
						</thead>
						<tbody>
							{#if addFiltered.length === 0}
								<tr>
									<td colspan="6" class="px-4 py-8 text-center text-muted-foreground">
										No products to show.
									</td>
								</tr>
							{:else}
								{#each addFiltered as p (p.id)}
									<tr class="border-b last:border-0">
										<td class="px-4 py-3">
											<input
												type="checkbox"
												class="rounded border-muted-foreground/50"
												aria-label="Select row"
												checked={addSelectedIds.has(p.id)}
												onchange={() => toggleAddSelection(p.id)}
											/>
										</td>
										<td class="px-4 py-3">
											<div class="flex items-center gap-3">
												{#if p.thumbnail}
													<img
														src={p.thumbnail}
														alt=""
														class="size-10 shrink-0 rounded-md object-cover"
													/>
												{:else}
													<div
														class="flex size-10 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground"
													>
														<ImageIcon class="size-5" />
													</div>
												{/if}
												<span class="font-medium">{p.title}</span>
											</div>
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{(p as any & { collection?: { title?: string | null } | null }).collection
												?.title ?? '—'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.sales_channels?.length
												? p.sales_channels.map((sc: any) => sc.name).join(', ')
												: '—'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">
											{p.variant_count ?? p.variants?.length ?? 0} variant
											{(p.variant_count ?? p.variants?.length ?? 0) === 1 ? '' : 's'}
										</td>
										<td class="px-4 py-3 text-muted-foreground">{p.status}</td>
									</tr>
								{/each}
							{/if}
						</tbody>
					</table>
				</div>
				{#if addCount > 0}
					<div class="flex items-center justify-between gap-4 border-t px-6 py-4">
						<p class="text-sm text-muted-foreground">
							{addStart} – {addEnd} of {addCount} results
						</p>
						<div class="flex items-center gap-2">
							<Button
								variant="outline"
								size="sm"
								disabled={addPage <= 1}
								onclick={() => (addPage = Math.max(1, addPage - 1))}
							>
								Prev
							</Button>
							<span class="text-sm text-muted-foreground">
								{addPage} of {addTotalPages} pages
							</span>
							<Button
								variant="outline"
								size="sm"
								disabled={addPage >= addTotalPages}
								onclick={() => (addPage = Math.min(addTotalPages, addPage + 1))}
							>
								Next
							</Button>
						</div>
					</div>
				{/if}
			</div>
			{#if addError}
				<p class="px-6 pb-2 text-sm text-destructive">{addError}</p>
			{/if}
			<div class="flex justify-end gap-2 border-t p-4">
				<Button variant="outline" onclick={() => (addSheetOpen = false)}>Cancel</Button>
				<Button onclick={submitAdd} disabled={addSubmitting}>
					{addSubmitting ? 'Saving…' : 'Save'}
				</Button>
			</div>
		</div>
	</Sheet.Content>
</Sheet.Root>

