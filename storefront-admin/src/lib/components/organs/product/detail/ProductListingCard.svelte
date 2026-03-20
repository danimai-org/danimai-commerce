
<script lang="ts">
	import Search from '@lucide/svelte/icons/search';
	import SlidersHorizontal from '@lucide/svelte/icons/sliders-horizontal';
	import ImageIcon from '@lucide/svelte/icons/image';
	import { client } from '$lib/client.js';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Sheet from '$lib/components/ui/sheet/index.js';
	import { cn } from '$lib/utils.js';
	import type { PaginationMeta, Product } from '../create/types.js';
	import ProductListingCardPicker from './ProductListingCard.svelte';

	type ProductFilter = Record<string, string | number | boolean | string[] | null | undefined>;
	interface Props {
		filter?: ProductFilter;
		selectedIds?: Set<string>;
		title?: string;
		emptyText?: string;
		embedded?: boolean;
		pickerFilter?: ProductFilter;
		addSheetTitle?: string;
		addSheetDescription?: string;
		onAddProducts?: (ids: string[]) => void | Promise<void>;
		onRemoveProducts?: (ids: string[]) => void | Promise<void>;
	}

	let {
		filter = {},
		selectedIds = $bindable(new Set<string>()),
		title = 'Products',
		emptyText = 'No products to show.',
		embedded = false,
		pickerFilter,
		addSheetTitle = 'Add products',
		addSheetDescription = 'Select products to add.',
		onAddProducts,
		onRemoveProducts
	}: Props = $props();

	let addSheetOpen = $state(false);
	let sheetSelectedIds = $state(new Set<string>());
	let sheetError = $state<string | null>(null);
	let addSubmitting = $state(false);
	let removeSubmitting = $state(false);
	let removeError = $state<string | null>(null);
	let listVersion = $state(0);

	let rows = $state<Product[]>([]);
	let pagination = $state<PaginationMeta | null>(null);
	let pageNum = $state(1);
	let limit = $state(10);
	let search = $state('');
	let loading = $state(false);
	let error = $state<string | null>(null);

	const normalizedFilter = $derived.by(() => {
		const entries = Object.entries(filter ?? {}).filter(([, value]) => {
			if (value == null) return false;
			if (Array.isArray(value)) return value.length > 0;
			if (typeof value === 'string') return value.trim().length > 0;
			return true;
		});
		return Object.fromEntries(entries) as ProductFilter;
	});
	const queryFilter = $derived.by(() => {
		const next = { ...normalizedFilter } as ProductFilter;

		const categoryId =
			typeof next.category_id === 'string' && next.category_id.trim().length > 0
				? next.category_id
				: undefined;
		if (categoryId && !Array.isArray(next.category_ids)) {
			next.category_ids = [categoryId];
		}

		const collectionId =
			typeof next.collection_id === 'string' && next.collection_id.trim().length > 0
				? next.collection_id
				: undefined;
		if (collectionId && !Array.isArray(next.collection_ids)) {
			next.collection_ids = [collectionId];
		}

		return next;
	});

	const filterKey = $derived.by(() => JSON.stringify(normalizedFilter));
	const isAttributeOrAttributeGroupListing = $derived.by(() => {
		const f = normalizedFilter;
		const attrId = typeof f.attribute_id === 'string' && f.attribute_id.trim().length > 0;
		const attrIds = Array.isArray(f.attribute_ids) && f.attribute_ids.length > 0;
		const groupId =
			typeof f.attribute_group_id === 'string' && f.attribute_group_id.trim().length > 0;
		const groupIds = Array.isArray(f.attribute_group_ids) && f.attribute_group_ids.length > 0;
		return attrId || attrIds || groupId || groupIds;
	});
	const count = $derived(pagination?.total ?? 0);
	const totalPages = $derived(Math.max(1, pagination?.total_pages ?? 1));
	const start = $derived(pagination ? (pagination.page - 1) * pagination.limit + 1 : 0);
	const end = $derived(pagination ? Math.min(pagination.page * pagination.limit, count) : 0);
	const allVisibleSelected = $derived(rows.length > 0 && rows.every((row) => selectedIds.has(row.id)));

	$effect(() => {
		filterKey;
		pageNum = 1;
	});

	$effect(() => {
		filterKey;
		listVersion;
		pageNum;
		limit;
		search;
		void loadProducts();
	});

	async function loadProducts() {
		loading = true;
		error = null;
		try {
			const res = await client.products.get({
				query: {
					...queryFilter,
					page: pageNum,
					limit,
					search: search.trim() || undefined,
					sorting_field: 'created_at',
					filters: filter ?? undefined
				}
			});
			const payload = res.data as
				| {
						data?:
							| {
									rows?: Product[];
									products?: Product[];
									pagination?: PaginationMeta;
							  }
							| Product[];
						rows?: Product[];
						products?: Product[];
						pagination?: PaginationMeta;
				  }
				| undefined;

			const dataNode = payload?.data;
			const dataObject = !Array.isArray(dataNode) ? dataNode : undefined;
			const resolvedRows =
				(Array.isArray(dataNode) ? dataNode : undefined) ??
				(Array.isArray(dataObject?.rows) ? dataObject.rows : undefined) ??
				(Array.isArray(dataObject?.products) ? dataObject.products : undefined) ??
				(Array.isArray(payload?.rows) ? payload.rows : undefined) ??
				(Array.isArray(payload?.products) ? payload.products : undefined) ??
				[];

			rows = applyLocalRelationFilter(resolvedRows, normalizedFilter);
			pagination =
				(Array.isArray(dataNode) ? null : dataObject?.pagination) ?? payload?.pagination ?? null;
		} catch (e) {
			rows = [];
			pagination = null;
			error = e instanceof Error ? e.message : String(e);
		} finally {
			loading = false;
		}
	}

	function toggleRowSelection(id: string) {
		const next = new Set(selectedIds);
		if (next.has(id)) next.delete(id);
		else next.add(id);
		selectedIds = next;
	}


	function toggleSelectAllVisible() {
		if (allVisibleSelected) {
			const next = new Set(selectedIds);
			for (const row of rows) next.delete(row.id);
			selectedIds = next;
			return;
		}
		const next = new Set(selectedIds);
		for (const row of rows) next.add(row.id);
		selectedIds = next;
	}

	function goToPage(nextPage: number) {
		pageNum = Math.min(totalPages, Math.max(1, nextPage));
	}

	function applyLocalRelationFilter(items: Product[], activeFilter: ProductFilter): Product[] {
		let next = items;

		const apiHandledKeys = new Set(Object.keys(queryFilter));

		const categoryId =
			typeof activeFilter.category_id === 'string' && activeFilter.category_id.trim().length > 0
				? activeFilter.category_id
				: undefined;
		if (categoryId && !apiHandledKeys.has('category_ids')) {
			next = next.filter((item) => {
				const candidate = item as Product & {
					category?: { id?: string | null } | null;
				};
				return candidate.category_id === categoryId || candidate.category?.id === categoryId;
			});
		}

		const collectionId =
			typeof activeFilter.collection_id === 'string' && activeFilter.collection_id.trim().length > 0
				? activeFilter.collection_id
				: undefined;
		if (collectionId && !apiHandledKeys.has('collection_ids')) {
			next = next.filter((item) => {
				const candidate = item as Product & {
					collection_id?: string | null;
					collection?: { id?: string | null } | null;
				};
				return (
					candidate.collection_id === collectionId || candidate.collection?.id === collectionId
				);
			});
		}

		return next;
	}

	function openAddSheet() {
		addSheetOpen = true;
		sheetSelectedIds = new Set();
		sheetError = null;
	}

	async function submitAddSelected() {
		if (!onAddProducts) return;
		if (sheetSelectedIds.size === 0) {
			sheetError = 'Select at least one product.';
			return;
		}
		sheetError = null;
		addSubmitting = true;
		try {
			await onAddProducts(Array.from(sheetSelectedIds));
			listVersion++;
			addSheetOpen = false;
			sheetSelectedIds = new Set();
		} catch (e) {
			sheetError = e instanceof Error ? e.message : String(e);
		} finally {
			addSubmitting = false;
		}
	}

	const selectedCount = $derived(selectedIds.size);

	async function submitRemoveSelected() {
		if (!onRemoveProducts || selectedCount === 0) return;
		removeSubmitting = true;
		removeError = null;
		try {
			const ids = Array.from(selectedIds);
			await onRemoveProducts(ids);
			selectedIds = new Set();
			listVersion++;
		} catch (e) {
			removeError = e instanceof Error ? e.message : String(e);
		} finally {
			removeSubmitting = false;
		}
	}
</script>

{#snippet listingInner()}
	<div
		class={cn(
			'flex flex-col gap-2',
			!embedded && 'border-b p-4',
			embedded && 'border-b px-2 py-3 sm:px-4'
		)}
	>
		<div
			class={cn(
				'flex flex-wrap items-center justify-between gap-4',
				embedded && 'gap-2'
			)}
		>
			{#if !embedded && title.trim().length > 0}
				<h2 class="font-semibold">{title}</h2>
			{:else if embedded && title.trim().length > 0}
				<h3 class="text-sm font-medium text-muted-foreground">{title}</h3>
			{:else}
				<span class="min-w-0 flex-1"></span>
			{/if}
			<div class="flex flex-wrap items-center gap-2">
				{#if !embedded && onRemoveProducts}
					<Button
						type="button"
						size="sm"
						variant="destructive"
						disabled={removeSubmitting || selectedCount === 0}
						onclick={submitRemoveSelected}
					>
						{removeSubmitting
							? 'Removing…'
							: `Remove${selectedCount > 1 ? ` (${selectedCount})` : ''}`}
					</Button>
				{/if}
				{#if !embedded && !isAttributeOrAttributeGroupListing}
					<Button type="button" size="sm" onclick={openAddSheet}>Add</Button>
				{/if}
				<Button size="sm" variant="outline">
					<SlidersHorizontal class="mr-2 size-4" />
					Sort
				</Button>
				<div class="relative">
					<Search
						class="pointer-events-none absolute left-2 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
					/>
					<Input class="h-9 w-56 pl-8" placeholder="Search" bind:value={search} />
				</div>
				<Button size="icon" variant="outline" class="size-9">
					<SlidersHorizontal class="size-4" />
				</Button>
			</div>
		</div>
		{#if removeError}
			<p class="text-sm text-destructive">{removeError}</p>
		{/if}
	</div>

	<div
		class={cn(
			'min-h-0 overflow-y-auto pl-6 pr-4',
			embedded ? 'flex-1 px-2 py-2 sm:px-4' : 'max-h-[min(55vh,28rem)]'
		)}
	>
		<table class="w-full text-sm">
			<thead class="sticky top-0 z-10 border-b bg-muted/20 text-left backdrop-blur-sm">
				<tr>
					<th class="w-10 ">
						<input
							type="checkbox"
							class="rounded border-muted-foreground/50"
							aria-label="Select all visible products"
							checked={allVisibleSelected}
							onchange={toggleSelectAllVisible}
						/>
					</th>
					<th class="px-4 py-3 font-medium">Product</th>
					<th class="px-4 py-3 font-medium">Collection</th>
					<th class="px-4 py-3 font-medium">Sales Channels</th>
					<th class="px-4 py-3 font-medium">Variants</th>
					<th class="px-4 py-3 font-medium">Status</th>
				</tr>
			</thead>
			<tbody>
				{#if loading}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">Loading…</td>
					</tr>
				{:else if error}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-destructive">{error}</td>
					</tr>
				{:else if rows.length === 0}
					<tr>
						<td colspan={6} class="px-4 py-8 text-center text-muted-foreground">{emptyText}</td>
					</tr>
				{:else}
					{#each rows as row (row.id)}
						<tr class="border-b last:border-b-0">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									class="rounded border-muted-foreground/50"
									aria-label={`Select ${row.title}`}
									checked={selectedIds.has(row.id)}
									onchange={() => toggleRowSelection(row.id)}
								/>
							</td>
							<td class="px-4 py-3">
								<a href={`/products/${row.id}`} class="flex items-center gap-3 hover:opacity-90">
									{#if row.thumbnail}
										<img src={row.thumbnail} alt="" class="size-10 rounded-md object-cover" />
									{:else}
										<div
											class="flex size-10 items-center justify-center rounded-md bg-muted text-muted-foreground"
										>
											<ImageIcon class="size-5" />
										</div>
									{/if}
									<span class="font-medium">{row.title}</span>
								</a>
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{(row as Product & { collection?: { title?: string | null } | null }).collection
									?.title ?? '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.sales_channels?.length
									? row.sales_channels.map((channel) => channel.name).join(', ')
									: '—'}
							</td>
							<td class="px-4 py-3 text-muted-foreground">
								{row.variant_count ?? row.variants?.length ?? 0}
							</td>
							<td class="px-4 py-3">
								<span
									class={cn(
										'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium capitalize',
										row.status === 'published' &&
											'bg-green-500/10 text-green-700 dark:text-green-400',
										row.status === 'draft' && 'bg-muted text-muted-foreground',
										row.status === 'proposed' &&
											'bg-amber-500/10 text-amber-700 dark:text-amber-400',
										row.status === 'rejected' && 'bg-destructive/10 text-destructive'
									)}
								>
									<span
										class={cn(
											'size-1.5 rounded-full',
											row.status === 'published' && 'bg-green-600',
											row.status === 'draft' && 'bg-muted-foreground/60',
											row.status === 'proposed' && 'bg-amber-600',
											row.status === 'rejected' && 'bg-destructive'
										)}
									></span>
									{row.status}
								</span>
							</td>
						</tr>
					{/each}
				{/if}
			</tbody>
		</table>
	</div>

	{#if count > 0}
		<div
			class={cn(
				'flex flex-wrap items-center justify-between gap-4 border-t py-3',
				embedded ? 'px-2 sm:px-4' : 'px-4'
			)}
		>
			<p class="text-sm text-muted-foreground">{start} - {end} of {count} results</p>
			<div class="flex items-center gap-2">
				<Button size="sm" variant="outline" onclick={() => goToPage(pageNum - 1)} disabled={pageNum <= 1}>
					Prev
				</Button>
				<span class="text-sm text-muted-foreground">{pageNum} of {totalPages}</span>
				<Button
					size="sm"
					variant="outline"
					onclick={() => goToPage(pageNum + 1)}
					disabled={pageNum >= totalPages}
				>
					Next
				</Button>
			</div>
		</div>
	{/if}
{/snippet}

{#if embedded}
	<div class="flex min-h-0 flex-1 flex-col">
		{@render listingInner()}
	</div>
{:else}
	<div class="rounded-lg border bg-card shadow-sm">
		{@render listingInner()}
	</div>

	{#if !isAttributeOrAttributeGroupListing}
		<Sheet.Root
			bind:open={addSheetOpen}
			onOpenChange={(open: boolean) => {
				if (!open) {
					sheetError = null;
				}
			}}
		>
			<Sheet.Content side="right" class="flex h-full max-h-screen w-full flex-col sm:max-w-4xl">
				<Sheet.Header class="flex flex-col gap-1.5 border-b px-6 py-4">
					<Sheet.Title>{addSheetTitle}</Sheet.Title>
					<Sheet.Description>{addSheetDescription}</Sheet.Description>
				</Sheet.Header>
				<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
					<ProductListingCardPicker
						embedded
						filter={pickerFilter ?? {}}
						bind:selectedIds={sheetSelectedIds}
						title=""
						{emptyText}
					/>
				</div>
				{#if sheetError}
					<p class="px-6 text-sm text-destructive">{sheetError}</p>
				{/if}
				<Sheet.Footer class="mt-auto flex flex-wrap justify-end gap-2 border-t p-4">
					<Button
						type="button"
						variant="outline"
						onclick={() => {
							addSheetOpen = false;
							sheetError = null;
						}}
					>
						Close
					</Button>
					{#if onAddProducts}
						<Button
							type="button"
							disabled={addSubmitting || sheetSelectedIds.size === 0}
							onclick={submitAddSelected}
						>
							{addSubmitting ? 'Adding…' : 'Add selected'}
						</Button>
					{/if}
				</Sheet.Footer>
			</Sheet.Content>
		</Sheet.Root>
	{/if}
{/if}
